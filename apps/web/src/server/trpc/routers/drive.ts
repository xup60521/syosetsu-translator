import { db } from "@/server/db";
import { account } from "@/server/db/auth-schema";
import { env } from "@/env";

import { eq, and } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, createTRPCRouter } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

/**
 * Cloudflare Workers-friendly Google OAuth + Drive helpers (native fetch).
 */

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type: "Bearer";
};

async function getGoogleAccessToken(refreshToken: string): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const body = new URLSearchParams({
    client_id: env.VITE_GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `Failed to refresh Google access token. ${text}`,
    });
  }

  const json = (await res.json()) as GoogleTokenResponse;
  if (!json.access_token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Google did not return an access_token.",
    });
  }

  return json.access_token;
}

async function googleDriveFetchJSON<T>(
  accessToken: string,
  url: string,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 401/403 are usually auth/scope issues; keep message helpful
    if (res.status === 401 || res.status === 403) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `Google Drive request unauthorized (${res.status}). ${text}`,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Google Drive request failed (${res.status}). ${text}`,
    });
  }

  return (await res.json()) as T;
}

async function googleDriveFetchText(
  accessToken: string,
  url: string,
): Promise<string> {
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `Google Drive request unauthorized (${res.status}). ${text}`,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Google Drive request failed (${res.status}). ${text}`,
    });
  }

  return await res.text();
}

function requireUserId(ctx: any): string {
  const userId = ctx.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  return userId;
}

async function getUserGoogleRefreshToken(userId: string): Promise<string> {
  const userAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });

  if (!userAccount?.refreshToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No Google Drive connection found.",
    });
  }

  return userAccount.refreshToken;
}

export const driveProcedure = createTRPCRouter({
  listFolders: protectedProcedure
    .input(
      z.object({
        parentId: z.string(),
        query: z.string().optional(),
        orderBy: z.string().optional().default("name"),
        cursor: z.string().nullish(), // Drive uses nextPageToken/pageToken
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = requireUserId(ctx);
      const refreshToken = await getUserGoogleRefreshToken(userId);
      const accessToken = await getGoogleAccessToken(refreshToken);

      const { parentId, query, cursor: pageToken, orderBy } = input;

      // Build Drive q
      let q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (query) {
        // Escape single quotes for Drive query syntax
        const safeQuery = query.replace(/'/g, "\\'");
        q += ` and name contains '${safeQuery}'`;
      }

      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", q);
      url.searchParams.set("fields", "nextPageToken, files(id, name)");
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", orderBy);
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      type DriveListResponse = {
        nextPageToken?: string;
        files?: Array<{ id?: string; name?: string }>;
      };

      try {
        const data = await googleDriveFetchJSON<DriveListResponse>(
          accessToken,
          url.toString(),
        );

        return {
          folders:
            data.files?.map((f) => ({
              id: f.id ?? "",
              name: f.name ?? "",
            })) ?? [],
          nextPageToken: data.nextPageToken,
        };
      } catch (error) {
        console.error("Error listing Drive folders:", error);
        // If it's already a TRPCError thrown by helper, just rethrow
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list folders.",
        });
      }
    }),

  fileContent: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = requireUserId(ctx);
      const refreshToken = await getUserGoogleRefreshToken(userId);
      const accessToken = await getGoogleAccessToken(refreshToken);

      const { fileId } = input;

      try {
        // Metadata (name, owners)
        const metaUrl = new URL(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            fileId,
          )}`,
        );
        metaUrl.searchParams.set("fields", "name,owners(displayName)");

        type DriveFileMeta = {
          name?: string;
          owners?: Array<{ displayName?: string }>;
        };

        const metadata = await googleDriveFetchJSON<DriveFileMeta>(
          accessToken,
          metaUrl.toString(),
        );

        // Content
        const contentUrl = new URL(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            fileId,
          )}`,
        );
        contentUrl.searchParams.set("alt", "media");

        const contentText = await googleDriveFetchText(
          accessToken,
          contentUrl.toString(),
        );

        return {
          content: contentText,
          title: metadata.name || "Untitled",
          author: metadata.owners?.[0]?.displayName || "Unknown",
        };
      } catch (error) {
        console.error("Error getting Drive file content:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get file content.",
        });
      }
    }),

  listFiles: protectedProcedure
    .input(z.object({ folderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = requireUserId(ctx);
      const refreshToken = await getUserGoogleRefreshToken(userId);
      const accessToken = await getGoogleAccessToken(refreshToken);

      const { folderId } = input;

      const q = `'${folderId}' in parents and (mimeType = 'text/plain' or name contains '.txt') and trashed = false`;

      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", q);
      url.searchParams.set("fields", "files(id,name,createdTime)");
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("orderBy", "name asc");

      type DriveListFilesResponse = {
        files?: Array<{ id?: string; name?: string; createdTime?: string }>;
      };

      try {
        const data = await googleDriveFetchJSON<DriveListFilesResponse>(
          accessToken,
          url.toString(),
        );

        const rawFiles = data.files ?? [];

        const sortedFiles = rawFiles.sort((a, b) => {
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

        return {
          files: sortedFiles.map((f) => ({
            id: f.id ?? "",
            name: f.name ?? "",
            createdTime: f.createdTime,
          })),
        };
      } catch (error) {
        console.error("Error listing Drive files:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list files.",
        });
      }
    }),
});