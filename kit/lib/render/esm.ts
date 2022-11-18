import { file } from "bun";
// import { build } from "esbuild";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { error } from "~/log";

export async function esm(path: string) {
    path = `.cache${path}`.replace(".tsx", ".js");
    if (!existsSync(path)) {
        return new Response("Not found", { status: 404 });
    }
    const headers = {
        "Content-Type": "application/javascript",
    };
    try {
        const code = readFileSync(path, "utf-8").replace(
            `import { jsxs } from "react/jsx-runtime";`,
            `import { jsxs } from "/_runtime";`,
        );
        // const code = (
        //     await build({
        //         entryPoints: [path],
        //         write: false,
        //         format: "esm",
        //     })
        // ).outputFiles[0].text.replace(
        //     `import { jsxs } from "react/jsx-runtime";`,
        //     `import { jsxs } from "/_runtime";`,
        // );
        return new Response(code, { headers });
    } catch (_) {
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function runtime() {
    const headers = {
        "Content-Type": "application/javascript",
    };
    return new Response(file(".cache/runtime"), { headers });
    // try {
    //     const code = (
    //         await build({
    //             stdin: {
    //                 resolveDir: resolve(import.meta.resolveSync("react"), ".."),
    //                 contents: `
    //                     export { Fragment, jsx, jsxs } from "react/jsx-runtime";
    //                 `,
    //             },
    //             write: false,
    //             format: "esm",
    //             bundle: true,
    //         })
    //     ).outputFiles[0].text;
    //     return new Response(code, { headers });
    // } catch (e) {
    //     error(e);
    //     return new Response("Internal Server Error", { status: 500 });
    // }
}
