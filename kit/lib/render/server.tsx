import { Suspense } from "react";
import { renderToReadableStream } from "react-dom/server";
import Document from "./document";
import { reduceUrl } from "./helper";

interface Module {
    default: any;
    layout?: any;
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
    Layout?: any;
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
            const Layout = module.layout;
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

export async function leafData(
    method: string,
    segment: string,
    context: any,
    input: any,
) {
    const path = segment.endsWith("/") ? `${segment}index` : segment;
    const module: Module = await import(`${process.cwd()}/app${path}`);
    return {
        get: method === "GET" ? await module.api?.get?.(context) : undefined,
        post:
            method === "POST"
                ? await module.api?.post?.(context, input)
                : undefined,
    };
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
        async ({ Component, Layout, content, data }) => {
            return (
                <Suspense>
                    <Component get={data.get} post={data.post}>
                        {content}
                    </Component>
                </Suspense>
            );
        },
    );
    return renderToReadableStream(<Document>{content}</Document>);
}
