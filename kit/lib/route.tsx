import { createContext, lazy, Suspense, useState } from "react";
import { ApiOutput } from "./api";
import { Context } from "./context";

export interface RouteContext {
    get: any;
    post: any;
    setGet: (_: any) => void;
    setPost: (_: any) => void;
}

export const RouteContext = createContext({
    get: {},
    post: {},
    setGet: (_: any) => {},
    setPost: (_: any) => {},
});

interface RouteProvider {
    children: React.ReactNode;
    path: string;
    data: any;
}

export function RouteProvider({
    children,
    path,
    data = { get: {}, post: {} },
}: RouteProvider) {
    const [get, setGet] = useState(data.get);
    const [post, setPost] = useState(data.post);
    return (
        <RouteContext.Provider
            value={{
                get,
                post,
                setGet,
                setPost,
            }}
        >
            <RouteWrapper path={path}>{children}</RouteWrapper>
        </RouteContext.Provider>
    );
}

interface RouteWrapper {
    children: React.ReactNode;
    path: string;
}

function RouteWrapper({ children, path }: RouteWrapper) {
    const Component = lazy(() => import(`${path}.tsx`));
    return (
        <RouteContext.Consumer>
            {(context) => (
                <Suspense>
                    <Component get={context.get} post={context.post}>
                        {children}
                    </Component>
                </Suspense>
            )}
        </RouteContext.Consumer>
    );
}

export interface Route<R = {}> extends ApiOutput<R> {
    children?: React.ReactNode;
    context: Context;
}
