import { readdirSync } from "fs";
import { warn } from "~/log";

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

export interface AppNode {
    url: string;
    dir: string;
    file: string;
    children: AppNode[];
}

export function walkApp(tree?: AppNode): AppNode {
    if (!tree) {
        tree = {
            url: "/",
            dir: "app",
            file: "app/index.tsx",
            children: [],
        };
    }
    const dirs = new Set();
    const treeUrl = tree.url === "/" ? "/" : `${tree.url}/`;
    if (tree.file.endsWith("index.tsx")) {
        const files = readdirSync(tree.dir, { withFileTypes: true });
        for (const file of files) {
            if (file.isDirectory()) {
                dirs.add(file.name);
            }
            if (file.name === "index.tsx") {
                continue;
            }
            if (!file.name.endsWith(".tsx")) {
                continue;
            }
            const plainName = file.name.replace(/\.tsx$/, "");
            if (dirs.has(plainName)) {
                warn("Duplicate route", `"${treeUrl}${plainName}"`);
                dirs.delete(plainName);
            }
            tree.children.push({
                url: `${treeUrl}${file.name.replace(/\.tsx$/, "")}`,
                dir: `${tree.dir}`,
                file: `${tree.dir}/${file.name}`,
                children: [],
            });
        }
    }
    for (const dir of dirs) {
        const files = readdirSync(`${tree.dir}/${dir}`);
        if (!files.includes("index.tsx")) {
            continue;
        }
        const subtree = {
            url: `${treeUrl}${dir}`,
            dir: `${tree.dir}/${dir}`,
            file: `${tree.dir}/${dir}/index.tsx`,
            children: [],
        };
        walkApp(subtree);
        tree.children.push(subtree);
    }
    return tree;
}
