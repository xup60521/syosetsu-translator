import { decrypt } from '@repo/shared/server';
import type { HandleFileInput } from '@repo/shared';

type GoogleTokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope?: string;
};

function escapeDriveQueryString(value: string) {
	// Drive query strings are wrapped in single quotes: '...'
	// Escape backslash first, then single quote.
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function refreshAccessToken(refreshToken: string) {
	const body = new URLSearchParams({
		client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
		client_secret: process.env.GOOGLE_CLIENT_SECRET!,
		refresh_token: refreshToken,
		grant_type: 'refresh_token',
	});

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		body,
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Failed to refresh access token: ${res.status} ${res.statusText} ${text}`);
	}

	const json = (await res.json()) as GoogleTokenResponse;

	if (!json.access_token) {
		throw new Error('Token response missing access_token');
	}

	return json.access_token;
}

async function driveFetch<T>(accessToken: string, url: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: {
			authorization: `Bearer ${accessToken}`,
			...(init.headers ?? {}),
		},
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Drive API error: ${res.status} ${res.statusText} ${text}`);
	}

	// Some upload endpoints can return empty responses; handle that safely.
	const contentType = res.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) {
		return undefined as unknown as T;
	}

	return (await res.json()) as T;
}

async function driveListFiles(accessToken: string, q: string, fields: string) {
	const url = new URL('https://www.googleapis.com/drive/v3/files');
	url.searchParams.set('q', q);
	url.searchParams.set('fields', fields);

	return driveFetch<{ files?: Array<{ id?: string }> }>(accessToken, url.toString(), { method: 'GET' });
}

async function driveCreateFile(accessToken: string, metadata: Record<string, unknown>, fields = 'id') {
	const url = new URL('https://www.googleapis.com/drive/v3/files');
	url.searchParams.set('fields', fields);

	return driveFetch<{ id?: string }>(accessToken, url.toString(), {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(metadata),
	});
}

async function driveUploadMedia(accessToken: string, fileId: string, mimeType: string, body: string) {
	const url = new URL(`https://www.googleapis.com/upload/drive/v3/files/${fileId}`);
	url.searchParams.set('uploadType', 'media');

	// For "media" upload, body is raw file content.
	return driveFetch<void>(accessToken, url.toString(), {
		method: 'PATCH',
		headers: {
			'content-type': mimeType,
		},
		body,
	});
}

export async function save_file_to_gdrive(data: HandleFileInput) {
	const { series_title_and_author, title, indexPrefix, content, istranslated = true, folder_id, encrypted_refresh_token } = data;

	if (!encrypted_refresh_token) {
		throw new Error('No encrypted refresh token');
	}

	//   console.log(data);

	try {
		const refresh_token = decrypt(encrypted_refresh_token, process.env.ENCRYPTION_KEY!);
		const accessToken = await refreshAccessToken(refresh_token);

		// 1) Find or create series subfolder under folder_id
		const escapedSeriesName = escapeDriveQueryString(series_title_and_author);

		const folderQ = [
			`name = '${escapedSeriesName}'`,
			`'${folder_id}' in parents`,
			`mimeType = 'application/vnd.google-apps.folder'`,
			`trashed = false`,
		].join(' and ');

		const folderSearch = await driveListFiles(accessToken, folderQ, 'files(id)');

		let targetFolderId = folderSearch.files?.[0]?.id;

		if (!targetFolderId) {
			const newFolder = await driveCreateFile(accessToken, {
				name: series_title_and_author,
				mimeType: 'application/vnd.google-apps.folder',
				parents: [folder_id],
			});
			if (!newFolder.id) {
				throw new Error('Failed to create folder: missing id');
			}
			targetFolderId = newFolder.id;
		}

		// 2) Prepare filename
		const fileName = `${indexPrefix}-${title}${istranslated ? '_translated' : ''}.txt`;
		const escapedFileName = escapeDriveQueryString(fileName);

		// 3) Search if same name file exists in that folder
		const fileQ = [`name = '${escapedFileName}'`, `'${targetFolderId}' in parents`, `trashed = false`].join(' and ');

		const fileSearch = await driveListFiles(accessToken, fileQ, 'files(id)');
		const existingFileId = fileSearch.files?.[0]?.id ?? null;

		if (existingFileId) {
			// 4a) Update file content (simple media upload)
			await driveUploadMedia(accessToken, existingFileId, 'text/plain', content);
			//   console.log(`檔案已更新: ${fileName}`);
			return;
		}

		// 4b) Create file metadata first, then upload content
		const newFile = await driveCreateFile(accessToken, {
			name: fileName,
			parents: [targetFolderId],
		});

		if (!newFile.id) {
			throw new Error('Failed to create file: missing id');
		}

		await driveUploadMedia(accessToken, newFile.id, 'text/plain', content);
		// console.log(`檔案已建立並寫入內容: ${fileName}`);
	} catch (error) {
		console.error('操作 Google Drive 時發生錯誤:', error);
		throw error;
	}
}
