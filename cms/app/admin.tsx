import { Context, Page } from "@lib/context";

export const api = {
    get: async () => {
        return {
            admin: "yes",
        };
    },
};

export default function ({ children, input }: Page<typeof api>) {
    return <div>Admin: {input.get?.admin}</div>;
}
