import type { Context, Identity, Route } from "@tangerine/kit";
import { Action, Form, Text } from "~/kit/form";

interface Post {
    username: string;
    password: string;
}

export const api = {
    post: async ({ db, session }: Context, { username, password }: Post) => {
        const identity = await db.queryFirst<Identity>(
            `SELECT * FROM _identity WHERE username = '${username}' AND crypto::argon2::compare(password, '${password}')`,
        );
        if (identity) {
            session.data["identity"] = identity.id;
            throw { redirect: "/" };
        }
        return {
            error: "Invalid username or password",
        };
    },
};

export default function ({ get, post }: Route<typeof api>) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
            </div>
            <Form className="w-64" error={post?.error}>
                <Text name="username" />
                <Text name="password" redacted={true} />
                <Action name="login" primary={true} />
            </Form>
        </div>
    );
}
