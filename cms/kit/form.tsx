interface Form {
    children?: React.ReactNode;
}

export function Form({ children }: Form) {
    return <form className="flex flex-col space-y-2">{children}</form>;
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
    className ??=
        "bg-zinc-800 text-zinc-400 rounded px-2 py-1 border border-zinc-500";
    children ??= name;
    return (
        <button
            className={className}
            name="action"
            value={name}
            type={primary ? "submit" : "button"}
            onClick={(event) => {
                const form = event.currentTarget.form!;
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "actionValue";
                input.value = value?.toString() ?? "";
                form.appendChild(input);
                // SUBMIT FORM HERE
                form.removeChild(input);
            }}
        >
            {children}
        </button>
    );
}
