import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";
import { UsersStore } from "./users-store";

class DataStores {
	_db: any;

	constructor() {
		const turso = createClient({
			url: process.env.TURSO_DATABASE_URL!,
			authToken: process.env.TURSO_AUTH_TOKEN,
		  });

		  this._db = drizzle(turso);
	}

	tenants() {
		return new TenantsStore(this._db);
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

