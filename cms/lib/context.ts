import { Api, Page as KitPage } from "@tangerine/kit";
import { Connection } from "./database";
import { createSession } from "./session";
import { Session } from "./types";

export { Api } from "@tangerine/kit";

export type Page<A> = KitPage<Context, Api<A>>;

export interface Context {
    db: Connection;
    session: Session;
}

export async function createContext(): Promise<Context> {
    const db = new Connection();
    await db.connect();
    const session = await createSession(db);
    return { db, session };
}

export async function destroyContext(context: Context) {}
