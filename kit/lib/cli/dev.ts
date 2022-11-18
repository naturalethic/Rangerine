import {
    file,
    serve,
    Serve,
    ServeOptions,
    Server,
    ServerWebSocket,
    spawnSync,
} from "bun";
import glob from "fast-glob";
import { existsSync, readFileSync } from "fs";
import mime from "mime-types";
import { resolve } from "path";
import { error, info, warn } from "~/log";
import { leafData, renderData, renderServer } from "~/render/server";

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
                    const path = `.cache${url.pathname}`.replace(".tsx", ".js");
                    if (!existsSync(path)) {
                        return new Response("Not found", { status: 404 });
                    }
                    return new Response(file(path), {
                        headers: {
                            "Content-Type": "application/javascript",
                        },
                    });
                } else if (url.pathname.includes("chunk")) {
                    const path = `.cache${url.pathname}`;
                    return new Response(file(path), {
                        headers: {
                            "Content-Type": "application/javascript",
                        },
                    });
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
                    const context = await createContext(refererUrl);
                    const data = await renderData(
                        request.method,
                        refererUrl.pathname,
                        context,
                    );
                    await destroyContext(context);
                    const code = readFileSync(".cache/client", "utf-8").replace(
                        "const data = {}",
                        `const data = ${JSON.stringify(data)}`,
                    );
                    return new Response(code, {
                        headers: {
                            "Content-Type": "application/javascript",
                        },
                    });
                } catch (e: any) {
                    error(e);
                    return new Response("Internal Server Error", {
                        status: 500,
                    });
                }
            } else {
                try {
                    const context = await createContext(new URL(request.url));
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
                            headers["Content-Type"] = "application/json";
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

async function createContext(url: URL) {
    try {
        let module: any;
        try {
            module = await import(resolve(process.cwd(), "lib/context.ts"));
        } catch (_) {
            warn("No context module found");
        }
        return await module.createContext(url);
    } catch (e: any) {
        error("Context:", e.message);
    }
    return {};
}

async function destroyContext(context: any) {
    try {
        let module: any;
        try {
            module = await import(resolve(process.cwd(), "lib/context.ts"));
        } catch (_) {
            warn("No context module found");
        }
        await module.destroyContext(context);
    } catch (e: any) {
        error("Context:", e.message);
    }
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

function buildRoutes() {
    spawnSync([
        "esbuild",
        "--format=esm",
        "--bundle",
        "--splitting",
        "--outdir=.cache",
        ...glob.sync("app/**/*.ts*"),
    ]);
}

export async function buildCss() {
    const tailwind =
        existsSync("tailwind.config.js") || existsSync("tailwind.config.cjs");
    const path = "app/index.css";
    if (!tailwind) {
        spawnSync(["cp", path, ".cache/index.css"]);
        return;
    }
    spawnSync(["tailwind", "-i", path, "-o", ".cache/index.css"]);
}
