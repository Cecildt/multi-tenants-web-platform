import { AnyD1Database, drizzle, DrizzleD1Database } from "drizzle-orm/d1";

import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";
import { UsersStore } from "./users-store";

class DataStores {
	#db: DrizzleD1Database;

	constructor(db: AnyD1Database) {
		this.#db = drizzle(db);
	}

	tenants() {
		return new TenantsStore(this.#db);
	}

	products() {
		return new ProductsStore();
	}

	users() {
		return new UsersStore();
	}
}

export default function (db: AnyD1Database) {
	return new DataStores(db);
}
