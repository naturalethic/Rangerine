import { file, serve, Serve, ServeOptions, Server } from "bun";
import { existsSync } from "fs";
import mime from "mime-types";
import { info } from "~/log";
import { css, esm, hydrate, render, renderData } from "~/render";
import { runtime } from "~/render/esm";

declare global {
    var server: Server;
}

export default function () {
    const hostname = "0.0.0.0";
    const port = 7777;
    if (globalThis.server) {
        info(`Reloading development server at ${hostname}:${port}`);
        server.reload(handler({ hostname, port }));
    } else {
        info(`Starting development server at ${hostname}:${port}`);
        globalThis.server = serve(handler({ hostname, port }));
    }
}

function handler(options: Partial<Serve<ServeOptions>>) {
    return {
        ...options,
        async fetch(request: Request) {
            const url = new URL(request.url);
            info(`${request.method} ${url.pathname}`);
            const headers: Record<string, string> = {};
            if (/\./.test(url.pathname)) {
                if (/[a-z-]+.tsx$/.test(url.pathname)) {
                    return await esm(url.pathname);
                } else if (
                    url.pathname.endsWith(".ts") ||
                    url.pathname.endsWith(".tsx")
                ) {
                    return new Response("Not found", { status: 404 });
                }
                const mimetype = mime.lookup(url.pathname);
                if (mimetype) {
                    headers["Content-Type"] = mimetype;
                }
                if (url.pathname.endsWith(".css")) {
                    return await css(url.pathname);
                }
                try {
                    return new Response(file(`app${url.pathname}`), {
                        headers,
                    });
                } catch (_) {
                    return new Response("Not found", { status: 404 });
                }
            } else if (url.pathname === "/_hydrate") {
                const referer = request.headers.get("referer");
                if (referer === null) {
                    return new Response("Bad Request", { status: 400 });
                }
                const refererUrl = new URL(referer);
                const data = await renderData(
                    request.method,
                    refererUrl.pathname,
                );
                info("DATA", data);
                return await hydrate(data);
            } else if (url.pathname === "/_runtime") {
                return await runtime();
            } else {
                try {
                    const html = await render(request.method, url.pathname);
                    headers["Content-Type"] = "text/html";
                    return new Response(html, { headers });
                } catch (e) {
                    return new Response("Internal Server Error", {
                        status: 500,
                    });
                }
            }
        },
    };
}
