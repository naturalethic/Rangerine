import { useEffect, useState } from "react";
import { Action, Form, Text } from "~/kit/form";
import { Context, Page } from "~/lib/context";

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

export default function ({ input }: Page<typeof api>) {
    return (
        <Form>
            <Text name="username" defaultValue={input.get?.username} />
            <Text
                name="password"
                defaultValue={input.get?.password}
                redacted={true}
            />
            <Action name="login">Foo</Action>
            <pre>{JSON.stringify(input.post)}</pre>
        </Form>
    );
}
