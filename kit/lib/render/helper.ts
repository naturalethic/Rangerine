interface UrlReducerParams<T> {
    url: string;
    method?: string;
    segment: string;
    path: string;
    content?: T;
    data?: any;
}

interface UrlReducer<T> {
    (params: UrlReducerParams<T>): Promise<T>;
}

interface ReduceUrlParams<T> {
    method?: string;
    url: string;
    content?: T;
    data?: any;
}

export async function reduceUrl<T>(
    { method, url, content, data }: ReduceUrlParams<T>,
    fn: UrlReducer<T>,
) {
    let segment = url;
    while (segment) {
        const path = segment.endsWith("/") ? `${segment}index` : segment;
        const local: any = data ? data[segment] : data;
        content = await fn({
            url,
            method,
            segment,
            path,
            content,
            data: local,
        });
        if (segment === "/") {
            break;
        }
        segment = `/${segment.split("/").slice(0, -1).join("/")}`;
    }
    return content;
}
