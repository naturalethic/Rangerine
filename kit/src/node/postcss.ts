import autoprefixer from "autoprefixer";
import { existsSync, readFileSync } from "fs";
import postcss from "postcss";
import tailwind from "tailwindcss";

async function run(url: string) {
    const plugins = [];
    if (existsSync("tailwind.config.js")) {
        plugins.push(tailwind());
        plugins.push(autoprefixer());
    }
    const from = `app${url}`;
    const result = await postcss(plugins).process(readFileSync(from, "utf-8"), {
        from,
    });
    return result.css;
}

run(process.argv[2]).then(console.log);
