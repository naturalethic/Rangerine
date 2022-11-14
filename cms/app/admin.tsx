import { Api, Page } from "@tangerine/kit";

export const api = {
    get: async () => {
        return {
            admin: "yes",
        };
    },
};

export default function ({ children, input }: Page<Api<typeof api>>) {
    return <div>Admin: {input.get?.admin}</div>;
}
