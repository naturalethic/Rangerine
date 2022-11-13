import { lazy, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";

function render() {
    let url = location.pathname;
    let content;
    let segment = url;
    while (segment) {
        const path = segment.endsWith("/") ? `${segment}index` : segment;
        console.log(`${path}?client`);
        const Page = lazy(async () => await import(`${path}?client`));
        content = (
            <Suspense>
                <Page>{content}</Page>
            </Suspense>
        );
        if (segment === "/") {
            break;
        }
        segment = `/${segment.split("/").slice(0, -1).join("/")}`;
    }
    return content;
}

hydrateRoot(document.querySelector("main")!, render());

declare global {
    interface Window {
        socket: any;
    }
}

function connect() {
    const socket = new WebSocket(`ws://${location.host}/_socket`);

    socket.addEventListener("error", (error: any) => {
        // console.error(error);
    });

    socket.addEventListener("open", () => {
        // console.log("open");
    });

    socket.addEventListener("close", () => {
        // console.log("close");
        setTimeout(connect, 1000);
    });

    socket.addEventListener("message", ({ data }) => {
        location.reload();
    });

    window.socket = socket;
}

connect();
