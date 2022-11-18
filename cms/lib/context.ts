import { Api, Page as KitPage } from "@tangerine/kit";
import { Connection, Pool } from "./database";
import { createSession } from "./session";
import { Session } from "./types";

export type { Api } from "@tangerine/kit";

export type Page<A> = KitPage<Context, Api<A>>;

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

export async function createContext(url: URL): Promise<Context> {
    const db = await globalThis.pool.acquire();
    const session = await createSession(db);
    return { db, session, url };
}

export async function destroyContext(context: Context) {
    // save session
    globalThis.pool.release(context.db);
}
