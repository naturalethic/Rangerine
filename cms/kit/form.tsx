import { RouteContext, RouterContext } from "@tangerine/kit";
import path from "object-path";
import { useContext } from "react";

interface Form {
    children?: React.ReactNode;
    className?: string;
    error?: string;
}

export function Form({ children, className = "", error }: Form) {
    return (
        <form
            className={`flex flex-col space-y-2 ${className}`}
            onSubmit={(event) => {
                event.preventDefault();
                console.log(event);
            }}
        >
            {children}
            {error && <div className="text-red-500 text-center">{error}</div>}
        </form>
    );
}

interface Text {
    name: string;
    value?: string;
    defaultValue?: string;
    label?: string;
    error?: string;
    redacted?: boolean;
    className?: string;
}

export function Text({
    name,
    value,
    defaultValue,
    label,
    error,
    redacted = false,
    className = "",
}: Text) {
    // label ??= humanize(name.split(".").pop()!);
    label ??= name;
    return (
        <label className="flex flex-col text-zinc-300 text-sm space-y-1">
            <div className="flex flex-row items-center">
                <div>{label}</div>
            </div>
            <input
                className={`border rounded border-zinc-400 bg-zinc-800 text-zinc-400 px-2 py-1 ${className}`}
                type={redacted ? "password" : "text"}
                name={name}
                value={value}
                defaultValue={defaultValue}
            />
            {error && <div className="text-red-500 text-center">{error}</div>}
        </label>
    );
}

interface Action {
    children?: React.ReactNode;
    className?: string;
    primary?: boolean;
    name?: string;
    method?: string;
    value?: string;
}

export function Action({
    children,
    className,
    primary = false,
    name = "submit",
    method = "post",
    value,
}: Action) {
    className ??=
        "bg-zinc-800 text-zinc-400 rounded px-2 py-1 border border-zinc-500";
    children ??= name;
    method = method.toLowerCase();
    const routerContext = useContext(RouterContext);
    const routeContext = useContext(RouteContext);
    return (
        <button
            className={className}
            name="action"
            value={name}
            type={primary ? "submit" : "button"}
            onClick={(event) => {
                event.preventDefault();
                submit(
                    routerContext,
                    routeContext,
                    event.currentTarget.form!,
                    method,
                    name,
                );
            }}
        >
            {children}
        </button>
    );
}

async function submit(
    routerContext: RouterContext,
    routeContext: RouteContext,
    form: HTMLFormElement,
    method: string,
    action: string,
) {
    let input = new FormData(form);
    let output: any = {};
    input.forEach((value, key) => path.set(output, key, value));
    output.action = action;
    let response = await fetch(window.location.href, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(output),
    });
    if (response.redirected) {
        const url = new URL(response.url);
        routerContext.setPath(url.pathname);
    } else {
        const result = await response.json();
        method === "post" && routeContext.setPost(result.post);
    }
}
