export default {
    async fetch(req) {
        const url = new URL(req.url);
        url.pathname = '/__scheduled';
        url.searchParams.append('cron', '* * * * *');
        return new Response(`To test the scheduled handler, try running "curl ${url.href}".`);
    },

    async scheduled(event, env, ctx): Promise<void> {
        // 1. 確認 URL 是否正確拼接
        const targetUrl = `${env.WORKFLOW_NOVEL_HANDLER_URL}/health`;
        console.log(`[Cron] Preparing to ping: ${targetUrl}`);

        try {
            // 2. 加上 ctx.waitUntil 確保 Worker 不會提早結束 (雖然 await 也可以，但雙重保險)
            const resp = await fetch(targetUrl);
            const wasSuccessful = resp.ok ? 'success' : 'fail';

            console.log(`[Cron] fired at ${event.cron}: ${wasSuccessful} (Status: ${resp.status})`);
        } catch (error) {
            // 3. 捕捉任何網路或 DNS 錯誤
            console.error(`[Cron] Request failed:`, error);
        }
    },
} satisfies ExportedHandler<Env>;