import "~/render/client"; // XXX: Import so that hot reload will respond to changes in it.
import {
    file,
    serve,
    Serve,
    ServeOptions,
    Server,
    ServerWebSocket,
    spawnSync,
    SyncSubprocess,
} from "bun";
import cookie from "cookie";
import glob from "fast-glob";
import { existsSync, readFileSync, rmSync } from "fs";
import mime from "mime-types";
import { createContext, destroyContext } from "~/context";
import { error, info } from "~/log";
import { walkApp } from "~/render/helper";
import { leafData, renderData, renderServer } from "~/render/server";

declare global {
    var server: Server;
    var sockets: ServerWebSocket[];
}

const project = process.cwd().split("/").pop();

export default function () {
    const hostname = "0.0.0.0";
    const port = 7777;
    if (globalThis.server) {
        info(`Reloading development server at ${hostname}:${port}`);
        build();
        server.reload(handler({ hostname, port }));
        sockets.forEach((socket) => socket.send("reload"));
    } else {
        info(`Starting development server at ${hostname}:${port}`);
        build();
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
            const sessionId = cookie.parse(
                request.headers.get("cookie") ?? "",
            ).session;
            if (server.upgrade(request)) {
                return new Response(null, { status: 101 });
            }
            const url = new URL(request.url);
            info(`${request.method} ${url.pathname}`);
            const headers: Record<string, string> = {
                "Content-Type": "application/javascript",
            };
            if (/\./.test(url.pathname)) {
                if (/[a-z-]+.tsx$/.test(url.pathname)) {
                    const path = `.cache/${project}/app${url.pathname}`.replace(
                        ".tsx",
                        ".js",
                    );
                    if (!existsSync(path)) {
                        return new Response("Not found", { status: 404 });
                    }
                    return new Response(file(path), { headers });
                } else if (url.pathname.includes("chunk")) {
                    const path = `.cache${url.pathname}`;
                    return new Response(file(path), { headers });
                } else if (url.pathname.endsWith(".tsx")) {
                    return new Response("Not found", { status: 404 });
                }
                const mimetype = mime.lookup(url.pathname);
                if (mimetype) {
                    headers["Content-Type"] = mimetype;
                }
                if (url.pathname.endsWith(".css")) {
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
                try {
                    const referer = request.headers.get("referer");
                    if (referer === null) {
                        return new Response("Bad Request", { status: 400 });
                    }
                    const refererUrl = new URL(referer);
                    const context = await createContext(refererUrl, sessionId);
                    headers["Set-Cookie"] = `session=${context.session.id}`;
                    const data = await renderData(
                        request.method,
                        refererUrl.pathname,
                        context,
                    );
                    await destroyContext(context);
                    const tree = walkApp();
                    const code = readFileSync(
                        ".cache/kit/lib/render/client.js",
                        "utf-8",
                    )
                        .replace(
                            "const data = {}",
                            `const data = ${JSON.stringify(data)}`,
                        )
                        .replace(
                            "const tree = {}",
                            `const tree = ${JSON.stringify(tree)}`,
                        );
                    return new Response(code, { headers });
                } catch (e: any) {
                    error(e);
                    return new Response("Internal Server Error", {
                        status: 500,
                    });
                }
            } else {
                try {
                    const context = await createContext(
                        new URL(request.url),
                        sessionId,
                    );
                    headers["Set-Cookie"] = `session=${context.session.id}`;
                    try {
                        if (request.method === "GET") {
                            const html = await renderServer(
                                request.method,
                                url.pathname,
                                context,
                            );
                            headers["Content-Type"] = "text/html";
                            return new Response(html, { headers });
                        } else {
                            const input = await request.json();
                            const data = await leafData(
                                request.method,
                                url.pathname,
                                context,
                                input,
                            );
                            return new Response(JSON.stringify(data), {
                                headers,
                            });
                        }
                    } catch (e: any) {
                        if (e.redirect) {
                            return Response.redirect(e.redirect);
                        } else {
                            throw e;
                        }
                    } finally {
                        await destroyContext(context);
                    }
                } catch (e) {
                    error(e);
                    return new Response("Internal Server Error", {
                        status: 500,
                    });
                }
            }
        },
    };
}

function build() {
    rmSync(".cache", { recursive: true });
    reportError(
        spawnSync([
            "esbuild",
            "--format=esm",
            "--bundle",
            "--log-level=error",
            "--splitting",
            "--outdir=.cache",
            ...[
                ...glob.sync("app/**/*.ts*"),
                import.meta.resolveSync("../render/client.tsx"),
            ],
        ]),
    );
    const tailwind =
        existsSync("tailwind.config.js") || existsSync("tailwind.config.cjs");
    const path = "app/index.css";
    if (!tailwind) {
        reportError(spawnSync(["cp", path, ".cache/index.css"]));
        return;
    }
    reportError(spawnSync(["tailwind", "-i", path, "-o", ".cache/index.css"]));
}

function reportError({ stderr, exitCode }: SyncSubprocess) {
    if (exitCode !== 0 && stderr) {
        error(stderr.toString());
    }
}
