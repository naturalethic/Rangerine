import { PageContext } from "@tangerine/kit";
import path from "object-path";

interface Form {
    children?: React.ReactNode;
}

export function Form({ children }: Form) {
    return (
        <form
            className="flex flex-col space-y-2"
            onSubmit={(event) => {
                event.preventDefault();
                console.log(event);
            }}
        >
            {children}
        </form>
    );
}

interface Text {
    name: string;
    value?: string;
    defaultValue?: string;
    label?: string;
    errors?: string[];
    redacted?: boolean;
}

export function Text({
    name,
    value,
    defaultValue,
    label,
    errors,
    redacted = false,
}: Text) {
    // label ??= humanize(name.split(".").pop()!);
    label ??= name;
    return (
        <label className="flex flex-col text-zinc-300 text-sm space-y-1">
            <div className="flex flex-row items-center">
                <div>{label}</div>
            </div>
            <input
                className="border rounded border-zinc-400 bg-zinc-800 text-zinc-400 px-2 py-1"
                type={redacted ? "password" : "text"}
                name={name}
                value={value}
                defaultValue={defaultValue}
            />
            {errors && (
                <div className="text-red-500">
                    {errors.map((error, i) => (
                        <div key={i}>{error}</div>
                    ))}
                </div>
            )}
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
    // const context = useContext(PageContext);
    // console.log("Context", context);
    className ??=
        "bg-zinc-800 text-zinc-400 rounded px-2 py-1 border border-zinc-500";
    children ??= name;
    return (
        <PageContext.Consumer>
            {(context) => (
                <button
                    className={className}
                    name="action"
                    value={name}
                    type={primary ? "submit" : "button"}
                    onClick={(event) => {
                        event.preventDefault();
                        submit(
                            context,
                            event.currentTarget.form!,
                            method,
                            name,
                        );
                    }}
                >
                    {children}
                </button>
            )}
        </PageContext.Consumer>
    );
}

async function submit(
    context: PageContext,
    form: HTMLFormElement,
    method: string,
    action: string,
) {
    let input = new FormData(form);
    let output: any = {};
    input.forEach((value, key) => (output[key] = value));
    output.action = action;
    // const hiddenForm = document.createElement("form");
    // const hiddenInput = document.createElement("input");
    // hiddenForm.method = method;
    // hiddenInput.type = "hidden";
    // hiddenInput.name = "input";
    // hiddenInput.value = JSON.stringify(output);
    // hiddenForm.appendChild(hiddenInput);
    // document.body.appendChild(hiddenForm);
    // hiddenForm.submit();
    // ------------
    let response = await fetch(window.location.href, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(output),
    });
    const result = await response.json();
    console.log(result);
    context.setInput(result);
    // console.log(await response.json());
}
