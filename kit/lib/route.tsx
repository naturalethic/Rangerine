import React, {
    createContext,
    lazy,
    Suspense,
    useContext,
    useEffect,
    useState,
} from "react";
import { ApiOutput } from "./api";
import { Context } from "./context";

export interface Link {
    children: React.ReactNode;
    path: string;
}

export function Link({ children, path }: Link) {
    const { setPath } = useContext(RouterContext);
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                setPath(path);
            }}
        >
            {children}
        </button>
    );
}

export interface RouterContext {
    path: string;
    setPath: (path: string) => void;
}

export const RouterContext = createContext({
    path: "",
    setPath: (_: string) => {},
});

interface RouterProvider {
    children: React.ReactNode;
}

export function RouterProvider({ children }: RouterProvider) {
    const [path, setPath] = useState(location.pathname);
    useEffect(() => {
        window.addEventListener("popstate", () => {
            setPath(location.pathname);
        });
    }, []);
    return (
        <RouterContext.Provider
            value={{
                path,
                setPath: (path) => {
                    history.pushState({ path }, "", path);
                    setPath(path);
                },
            }}
        >
            {children}
        </RouterContext.Provider>
    );
}

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
    Component: any;
    subroutes: JSX.Element[];
    data: any;
}

export function RouteProvider({
    Component,
    subroutes,
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
            <RouteWrapper Component={Component} subroutes={subroutes} />
        </RouteContext.Provider>
    );
}

interface RouteWrapper {
    Component: any;
    subroutes: JSX.Element[];
}

function RouteWrapper({ Component, subroutes }: RouteWrapper) {
    const { path: currentPath } = useContext(RouterContext);
    const { get, post } = useContext(RouteContext);
    return (
        <Suspense fallback="Loading...">
            <Component get={get} post={post}>
                {subroutes.filter((child) =>
                    currentPath.startsWith(child.key as string),
                )}
            </Component>
        </Suspense>
    );
}

export interface Route<R = {}> extends ApiOutput<R> {
    children?: React.ReactNode;
    context: Context;
}
