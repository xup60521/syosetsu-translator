// src/server.ts
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export { SyosetsuTranslatorWorkflow } from "./workflow";

export default createServerEntry({
    fetch(request) {
        return handler.fetch(request);
    },
});
