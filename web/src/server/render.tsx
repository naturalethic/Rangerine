import { renderToString } from 'react-dom/server';

import Document from './document';

function render(url: string) {
    return renderToString(<Document />);
}

console.log(render(process.argv[2]));
