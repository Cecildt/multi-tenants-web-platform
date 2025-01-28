import { ProductsDB } from "./products-db";
import { TenantsDB } from "./tenants-db";

class DatabaseAdapter {
	constructor() {
	}

	tenants() {
		return new TenantsDB();
	}

	products() {
		return new ProductsDB();
	}
}

export default function () {
	return new DatabaseAdapter();
}

