import type { Context, Route } from "@tangerine/kit";
import { useEffect, useState } from "react";
import { Action, Form, Text } from "~/kit/form";

interface Post {
    username: string;
    password: string;
}

export const api = {
    get: async () => {
        return {
            username: "admin",
            password: "admin",
        };
    },
    post: async (context: Context, input: Post) => {
        return input;
    },
};

export default function ({ get, post }: Route<typeof api>) {
    return (
        <Form>
            <Text name="username" defaultValue={get?.username} />
            <Text
                name="password"
                defaultValue={get?.password}
                redacted={true}
            />
            <Action name="login">Foo</Action>
            <pre>{JSON.stringify(post)}</pre>
        </Form>
    );
}
