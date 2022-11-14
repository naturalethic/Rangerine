import { data } from "./lib/render.js";

const [method, url] = process.argv.slice(2);
data(method, url).then((it) => process.stdout.write(JSON.stringify(it)));
