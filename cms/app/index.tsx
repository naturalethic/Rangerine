import type { Context, Route } from "@tangerine/kit";
import { Link } from "@tangerine/kit";

export const api = {
    get: async (context: Context) => {
        if (context.url.pathname !== "/login") {
            if (!context.session.data.identity) {
                throw { redirect: "/login" };
            }
        }
    },
};

export function layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
            </div>
            {children}
        </div>
    );
}

export default function ({ children }: Route) {
    return <div className="h-screen bg-zinc-700">{children}</div>;
}
