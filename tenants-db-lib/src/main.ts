import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";
import { UsersStore } from "./users-store";

class DataStores {
	constructor() {
	}

	tenants() {
		return new TenantsStore();
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

