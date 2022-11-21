import React, { createContext, lazy, Suspense, useState } from "react";
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
    subroutes: JSX.Element[];
    path: string;
    file: string;
    data: any;
}

export function RouteProvider({
    subroutes,
    path,
    file,
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
            <RouteWrapper path={path} file={file} subroutes={subroutes} />
        </RouteContext.Provider>
    );
}

interface RouteWrapper {
    subroutes: JSX.Element[];
    path: string;
    file: string;
}

function RouteWrapper({ subroutes, path, file }: RouteWrapper) {
    const Component = lazy(() => import(file));
    return (
        <RouteContext.Consumer>
            {(context) => (
                <Suspense>
                    <Component get={context.get} post={context.post}>
                        {subroutes.filter((child) =>
                            location.pathname.startsWith(child.props.path),
                        )}
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
