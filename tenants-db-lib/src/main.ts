import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";
import { UsersStore } from "./users-store";

class DataStores {
	// private db_con: any;

	constructor() {
		// const turso = createClient({
		// 	url: process.env.TURSO_DATABASE_URL!,
		// 	authToken: process.env.TURSO_AUTH_TOKEN,
		//   });

		//   this.db_con = drizzle(turso);
	}

	tenants() {
		const turso = createClient({
			url: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL : '',
			authToken: process.env.TURSO_AUTH_TOKEN,
		  });

		  const db_con = drizzle(turso);

		return new TenantsStore(db_con);
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

