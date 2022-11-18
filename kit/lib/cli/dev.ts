import {
    file,
    serve,
    Serve,
    ServeOptions,
    Server,
    ServerWebSocket,
    spawn,
    spawnSync,
} from "bun";
import glob from "fast-glob";
import { existsSync } from "fs";
import mime from "mime-types";
import { info } from "~/log";
import { css, esm, hydrate, render, renderData } from "~/render";
import { buildCss } from "~/render/css";
import { runtime } from "~/render/esm";

declare global {
    var server: Server;
    var sockets: ServerWebSocket[];
}

export default function () {
    const hostname = "0.0.0.0";
    const port = 7777;
    if (globalThis.server) {
        info(`Reloading development server at ${hostname}:${port}`);
        buildRoutes();
        buildCss();
        server.reload(handler({ hostname, port }));
        sockets.forEach((socket) => socket.send("reload"));
    } else {
        info(`Starting development server at ${hostname}:${port}`);
        buildClient();
        buildRuntime();
        buildRoutes();
        buildCss();
        globalThis.server = serve(handler({ hostname, port }));
        globalThis.sockets = [];
    }
}

function handler(options: Partial<Serve<ServeOptions>>) {
    return {
        ...options,
        websocket: {
            open(socket: ServerWebSocket) {
                globalThis.sockets.push(socket);
            },
            message(socket: ServerWebSocket, message: any) {
                socket.send(message);
            },
        },
        async fetch(request: Request, server: Server) {
            if (server.upgrade(request)) {
                return new Response(null, { status: 101 });
            }
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
                    // return await css(url.pathname);
                    // XXX: Don't assume index here.
                    return new Response(file(".cache/index.css"), { headers });
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

function buildClient() {
    spawnSync([
        "esbuild",
        "--bundle",
        "--format=esm",
        "--outfile=.cache/client",
        import.meta.resolveSync("../render/client.tsx"),
    ]);
}

function buildRuntime() {
    spawnSync([
        "esbuild",
        "--bundle",
        "--format=esm",
        "--outfile=.cache/runtime",
        import.meta.resolveSync("../render/runtime.ts"),
    ]);
}

function buildRoutes() {
    spawnSync([
        "esbuild",
        "--format=esm",
        "--outdir=.cache",
        ...glob.sync("app/**/*.ts*"),
    ]);
}
