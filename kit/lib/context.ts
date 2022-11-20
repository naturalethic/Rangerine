import type { RecordError } from "surrealdb.js/types/errors";
import { Connection, Pool } from "./database";
import { createSession, readSession } from "./session";
import { Session } from "./types";

declare global {
    var pool: Pool;
}

if (!globalThis.pool) {
    globalThis.pool = new Pool(10);
}

export interface Context {
    db: Connection;
    session: Session;
    url: URL;
}

export async function createContext(
    url: URL,
    sessionId?: string,
): Promise<Context> {
    const db = await globalThis.pool.acquire();
    let session;
    try {
        session = sessionId
            ? await readSession(db, sessionId)
            : await createSession(db);
    } catch (e) {
        session = await createSession(db);
    }
    return { db, session, url };
}

export async function destroyContext({ db, session }: Context) {
    await db.update(session);
    globalThis.pool.release(db);
}
