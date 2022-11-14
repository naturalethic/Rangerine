import es from "esbuild";
import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import Document from "./document.js";

// Remember to remove homebrew esbuild

async function render(url: string) {
    let content;
    let segment = url;
    while (segment) {
        const path = segment.endsWith("/") ? `${segment}index` : segment;
        const codex = await es.build({
            write: false,
        });
        // console.log("CODEX", codex);
        // const code = readFileSync(`.cache/app${path}.js`, "utf-8").replace(
        //     `var import_jsx_runtime = require("react/jsx-runtime");`,
        //     "",
        // );
        // const Page = eval(code).default;
        const module = await import(`../app${path}.js`);
        // const Page = await import(`../app${path}.js`).then(
        //     (module) => module.default,
        // );
        const Page = module.default;
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
