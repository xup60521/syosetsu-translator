import { env } from "@/env";
import { Client } from "@upstash/workflow";

export const qstashClient = new Client({
    // Local QStash server,
    baseUrl: env.QSTASH_URL!,
    token: env.QSTASH_TOKEN!,
});