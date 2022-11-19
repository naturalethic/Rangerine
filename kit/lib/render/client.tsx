/// <reference lib="dom" />

import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { PageProvider } from "~/page";
import { reduceUrl } from "./helper";

async function render() {
    const data: Record<string, any> = {};
    return await reduceUrl<any>(
        { url: location.pathname, data },
        async ({ path, content, data }) => {
            return (
                <PageProvider path={path} data={data}>
                    {content}
                </PageProvider>
            );
        },
    );
}

declare global {
    interface Window {
        socket: any;
    }
}

function connect() {
    const socket = new WebSocket(`ws://${location.host}/`);

    socket.addEventListener("error", (error: any) => {});

    socket.addEventListener("open", () => {});

    socket.addEventListener("close", () => {
        setTimeout(connect, 1000);
    });

    socket.addEventListener("message", ({ data }) => {
        location.reload();
    });

    window.socket = socket;
}

if (typeof window !== "undefined") {
    render().then((content: any) => {
        hydrateRoot(
            document.querySelector("main")!,
            <StrictMode>{content}</StrictMode>,
        );
    });
    connect();
}
