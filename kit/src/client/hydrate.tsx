import { lazy, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { reduceUrl } from "../lib/helper.js";

async function render() {
    const data: Record<string, any> = {};
    return await reduceUrl<any>(
        { url: location.pathname, data },
        async ({ path, content, data }) => {
            const Component = lazy(async () => await import(`${path}?client`));
            return (
                <Suspense>
                    <Component input={data}>{content}</Component>
                </Suspense>
            );
        },
    );
}

render().then((content: any) => {
    hydrateRoot(document.querySelector("main")!, content);
});

declare global {
    interface Window {
        socket: any;
    }
}

function connect() {
    const socket = new WebSocket(`ws://${location.host}/_socket`);

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

connect();
