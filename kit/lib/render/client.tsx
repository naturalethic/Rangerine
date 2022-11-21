/// <reference lib="dom" />

import { lazy, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouteProvider, RouterProvider } from "~/route";
import { AppNode } from "./helper";

function renderApp(tree: AppNode, data: Record<string, any>) {
    tree.Component = lazy(() => import(tree.file.replace(/^app/, "")));
    const subroutes = [];
    for (const child of tree.children) {
        subroutes.push(renderApp(child, data));
    }
    return (
        <RouteProvider
            key={tree.url}
            data={data[tree.url]}
            subroutes={subroutes}
            Component={tree.Component}
        />
    );
}

async function render() {
    // @ts-ignore
    const tree: AppNode = {};
    const data: Record<string, any> = {};
    return renderApp(tree, data);
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
            <StrictMode>
                <RouterProvider>{content}</RouterProvider>
            </StrictMode>,
        );
    });
    connect();
}
