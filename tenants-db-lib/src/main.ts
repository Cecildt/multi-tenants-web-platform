import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

class DataStores {
	#db: LibSQLDatabase;

	constructor() {
		const turso = createClient({
			url: process.env.TURSO_DATABASE_URL!,
			authToken: process.env.TURSO_AUTH_TOKEN,
		  });

		  this.#db = drizzle(turso);
	}

}

export default function () {
	return new DataStores();
}
