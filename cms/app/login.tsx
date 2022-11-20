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
        <Form className="w-64" error={post?.error}>
            <Text name="username" />
            <Text name="password" redacted={true} />
            <Action name="login" />
        </Form>
    );
}
