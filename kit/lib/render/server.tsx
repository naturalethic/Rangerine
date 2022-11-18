import { Suspense } from "react";
import { renderToReadableStream, renderToString } from "react-dom/server";
import Document from "./document";
import { reduceUrl } from "./helper";

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
    context?: any;
}

interface UrlReducer<T> {
    (params: UrlReducerParams<T>): Promise<T>;
}

async function reduce<T>(
    method: string,
    url: string,
    content: any,
    context: any,
    fn: UrlReducer<T>,
) {
    return await reduceUrl<any>(
        { method, url, content },
        async ({ path, segment, content }) => {
            const module: Module = await import(`${process.cwd()}/app${path}`);
            const data = {
                get:
                    method === "GET"
                        ? await module.api?.get?.(context)
                        : undefined,
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

export async function renderData(method: string, url: string, context: any) {
    return await reduce<any>(
        method,
        url,
        {},
        context,
        async ({ segment, content, data }) => {
            content[segment] = data;
            return content;
        },
    );
}

export async function renderServer(method: string, url: string, context: any) {
    const content = await reduce<any>(
        method,
        url,
        undefined,
        context,
        async ({ Component, content, data }) => {
            return (
                <Suspense>
                    <Component input={data}>{content}</Component>
                </Suspense>
            );
        },
    );
    return renderToReadableStream(<Document>{content}</Document>);
}