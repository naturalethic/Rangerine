import { render } from "./lib/render.js";

const [method, url] = process.argv.slice(2);
render(method, url).then(console.log);

/// THESE SHOULD BE CLI FUNCTIONS
