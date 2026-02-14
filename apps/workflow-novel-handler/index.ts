import { Hono } from "hono";


const app = new Hono()

app.get("/", async (c) => {
    return c.text("Hello from Hono!")
})

export default {
    port: 3001, // dev and render server are running on port 3001
    fetch: app.fetch
}