import { Connection, Pool } from "./database";
import { createSession } from "./session";
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

export async function createContext(request: Request): Promise<Context> {
    const url = new URL(request.url);
    const db = await globalThis.pool.acquire();
    const session = await createSession(db);
    return { db, session, url };
}

export async function destroyContext(context: Context) {
    // save session
    globalThis.pool.release(context.db);
}

// export async function createContext(url: URL): Promise<Context> {
//     const db = await globalThis.pool.acquire();
//     const session = await createSession(db);
//     return { db, session, url };
// }
