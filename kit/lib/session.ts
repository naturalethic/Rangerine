import { Connection } from "./database";
import { Session } from "./types";

export async function createSession(db: Connection): Promise<Session> {
    return await db.create<Session>("_session", {
        data: {},
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
}

export async function readSession(
    db: Connection,
    id: string,
): Promise<Session> {
    return await db.select<Session>(id);
}
