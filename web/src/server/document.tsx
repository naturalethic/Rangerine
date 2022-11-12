import { StrictMode } from 'react';

export default function ({ children }: { children?: React.ReactNode }) {
    return (
        <StrictMode>
            <html>
                <head>
                    <meta charSet="utf-8" />
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1"
                    />
                    <link rel="icon" href="/favicon.ico" />
                    <script src="/_hydrate" defer={true} />
                </head>
                <body>{/* <Suspense>{children}</Suspense> */}</body>
            </html>
        </StrictMode>
    );
}
