import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";
import { UsersStore } from "./users-store";

class DataStores {
	#db: LibSQLDatabase;

	constructor() {
		const turso = createClient({
			url: process.env.TURSO_DATABASE_URL!,
			authToken: process.env.TURSO_AUTH_TOKEN,
		  });

		  this.#db = drizzle(turso);
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

export default function () {
	return new DataStores();
}

