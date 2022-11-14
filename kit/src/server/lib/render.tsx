import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { reduceUrl } from "../../lib/helper.js";
import Document from "./document.js";

interface Module {
    default: any;
    api: {
        get: any;
        post: any;
    };
}

interface UrlReducerParams<T> {
    url: string;
    method: string;
    segment: string;
    path: string;
    module: Module;
    Component: any;
    content: T;
    data?: any;
}

interface UrlReducer<T> {
    (params: UrlReducerParams<T>): Promise<T>;
}

async function reduce<T>(
    method: string,
    url: string,
    content: any,
    fn: UrlReducer<T>,
) {
    return await reduceUrl<any>(
        { method, url, content },
        async ({ path, segment }) => {
            const module = await import(`../../../app${path}.js`);
            const data = {
                get: method === "GET" ? await module.api?.get?.() : undefined,
            };
            const Component = module.default;
            return await fn({
                url,
                method,
                segment,
                path,
                module,
                content,
                data,
                Component,
            });
        },
    );
}

export async function data(method: string, url: string) {
    return await reduce<any>(
        method,
        url,
        {},
        async ({ segment, content, data }) => {
            content[segment] = data;
            return content;
        },
    );
}

export async function render(method: string, url: string) {
    const content = await reduce<any>(
        method,
        url,
        undefined,
        async ({ Component, content, data }) => {
            return (
                <Suspense>
                    <Component input={data}>{content}</Component>
                </Suspense>
            );
        },
    );
    return renderToString(<Document>{content}</Document>);
}
