import { renderToString } from 'react-dom/server';

import { Html } from '../app/html';

function render(url: string) {
    return renderToString(<Html>{url}</Html>);
}

console.log(render(process.argv[2]));
