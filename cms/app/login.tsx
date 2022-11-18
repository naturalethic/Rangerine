import { Action, Form, Text } from "~/kit/form";

export default function () {
    return (
        <Form>
            <Text name="username" />
            <Text name="password" redacted={true} />
            <Action name="login" />
        </Form>
    );
}
