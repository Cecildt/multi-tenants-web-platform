import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { TenantsStore } from "./tenants-store";

type AnyD1Database = Parameters<typeof drizzle>[0];

class DataStores {
	#db: DrizzleD1Database;

	constructor(db: AnyD1Database) {
		this.#db = drizzle(db);
	}

	tenants(): TenantsStore {
		return new TenantsStore(this.#db);
	}
}

export default function (db: AnyD1Database): DataStores {
	return new DataStores(db);
}
