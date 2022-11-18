import { createContext, lazy, Suspense, useContext, useState } from "react";

export interface PageContext {
    input: any;
    output: any;
    setInput: (input: any) => void;
    setOutput: (output: any) => void;
}

export const PageContext = createContext({
    input: {},
    output: {},
    setInput: (input: any) => {},
    setOutput: (output: any) => {},
});

interface PageProvider {
    children: React.ReactNode;
    path: string;
    data: any;
}

export function PageProvider({ children, path, data = {} }: PageProvider) {
    const [input, setInput] = useState(data);
    const [output, setOutput] = useState({});
    return (
        <PageContext.Provider
            value={{
                input,
                output,
                // setInput: (input: any) => setInput(input),
                setInput,
                setOutput,
            }}
        >
            <Page path={path}>{children}</Page>
        </PageContext.Provider>
    );
}

interface Page {
    children: React.ReactNode;
    path: string;
}

function Page({ children, path }: Page) {
    const Component = lazy(() => import(`${path}.tsx`));
    return (
        <PageContext.Consumer>
            {(context) => (
                <Suspense>
                    <Component input={context.input} output={context.output}>
                        {children}
                    </Component>
                </Suspense>
            )}
        </PageContext.Consumer>
    );
}
