import type { Context, Route } from "@tangerine/kit";

export const api = {
    get: async (context: Context) => {
        if (context.url.pathname !== "/login") {
            if (!context.session.data.identity) {
                throw { redirect: "/login" };
            }
        }
    },
};

export default function ({ children }: Route) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-700 font-iosevka text-zinc-200">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
            </div>
            {children}
        </div>
    );
}
