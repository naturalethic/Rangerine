import { Context, Page } from "@lib/context";

export const api = {
    get: async (context: Context) => {
        return {
            session: context.session,
            foo: "foo",
            bar: "bar",
            baz: "baz",
        };
    },
};

export default function ({ children, input }: Page<typeof api>) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-700 font-iosevka text-zinc-200">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
                {input.get?.bar}
            </div>
            <div>{input.get?.session.id}</div>
            {children}
        </div>
    );
}
