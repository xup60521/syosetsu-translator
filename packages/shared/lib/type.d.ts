export type WorkflowPayloadType = {
    urls: string[];
    provider: (typeof supportedProvider)[number]["value"];
    encrypted_api_key: string;
    encrypted_refresh_token: string;
    user_id: string;
    model_id: string;
    concurrency: number;
    batch_size: number;
    folder_id: string;
    api_key_name?: string;
}

export type NovelHandlerResultType = {
    id: string;
    title: string;
    indexPrefix: string;
    content: string;
    series_title_and_author: string;
    series_title: string;
    url: string;
    author: string;
    tags?: string[];
};