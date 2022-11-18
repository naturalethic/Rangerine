import { spawnSync } from "bun";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { error } from "~/log";

const tailwind =
    existsSync("tailwind.config.js") || existsSync("tailwind.config.cjs");

export async function css(url: string) {
    const path = `app${url}`;
    const headers = {
        "Content-Type": "text/css",
    };
    if (!tailwind) {
        return new Response(await readFile(path), { headers });
    }
    const { stdout, stderr, exitCode } = await spawnSync([
        "tailwind",
        "-i",
        path,
    ]);
    if (exitCode !== 0) {
        error("Tailwind error:", stderr?.toString());
        return new Response("Internal Server Error", { status: 500 });
    }
    return new Response(stdout, { headers });
}

export async function buildCss() {
    const path = "app/index.css";
    if (!tailwind) {
        spawnSync(["cp", path, ".cache/index.css"]);
        return;
    }
    spawnSync(["tailwind", "-i", path, "-o", ".cache/index.css"]);
}
