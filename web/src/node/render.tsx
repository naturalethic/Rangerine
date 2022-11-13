import "react/jsx-runtime";
import { sync as glob } from "fast-glob";
import { readFileSync } from "fs";
import { Module } from "module";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import Document from "../split/document";

async function render(url: string) {
    let content;
    let segment = url;
    while (segment) {
        const path = segment.endsWith("/") ? `${segment}index` : segment;
        const code = readFileSync(`.cache/app${path}.js`, "utf-8").replace(
            `var import_jsx_runtime = require("react/jsx-runtime");`,
            "",
        );
        const Page = eval(code).default;
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
    return renderToString(<Document>{content}</Document>);
}

render(process.argv[2]).then(console.log);
