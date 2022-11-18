// import { build } from "esbuild";
import { readFileSync } from "fs";
import { error } from "~/log";

export async function hydrate(data: any) {
    try {
        const headers = {
            "Content-Type": "application/javascript",
        };
        const code = readFileSync(".cache/client", "utf-8").replace(
            "const data = {}",
            `const data = ${JSON.stringify(data)}`,
        );
        return new Response(code, { headers });
    } catch (e) {
        error(e);
        return new Response("Internal Server Error", { status: 500 });
    }
}

// export async function hydrate(data: any) {
//     try {
//         const headers = {
//             "Content-Type": "application/javascript",
//         };
//         const code = (
//             await build({
//                 entryPoints: [import.meta.resolveSync("./client.tsx")],
//                 write: false,
//                 bundle: true,
//                 format: "esm",
//             })
//         ).outputFiles[0].text.replace(
//             "const data = {}",
//             `const data = ${JSON.stringify(data)}`,
//         );
//         return new Response(code, { headers });
//     } catch (e) {
//         error(e);
//         return new Response("Internal Server Error", { status: 500 });
//     }
// }
