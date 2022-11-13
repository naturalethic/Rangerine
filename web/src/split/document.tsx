import { StrictMode, Suspense } from "react";

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
                    <script src="/_hydrate" type="module" />
                </head>
                <body>
                    <main>{children}</main>
                </body>
            </html>
        </StrictMode>
    );
}
