import { Api, Page } from "@tangerine/kit";

export const api = {
    get: async (input: { foo: string }) => {
        return {
            foo: input.foo,
            bar: "bar",
            baz: "baz",
        };
    },
};

export default function ({ children, input }: Page<Api<typeof api>>) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-700 font-iosevka text-zinc-200">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
            </div>
            {children}
        </div>
    );
}
