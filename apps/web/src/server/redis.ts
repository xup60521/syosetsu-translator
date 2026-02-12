import { env } from "@/env"
import {Redis} from "@upstash/redis"

export const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
})

export interface RedisTaskData {
    status: string;
    progress: string | number;
    current: string | number;
    total: string | number;
    urls: string; // 儲存時是 JSON.stringify
    error_message?: string;
    created_at?: string | number;
    provider?: string;
    model_id?: string;
    api_key_name?: string;
}