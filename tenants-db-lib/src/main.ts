import { ProductsStore } from "./products-store";
import { TenantsStore } from "./tenants-store";

class DataStores {
	constructor() {
	}

	tenants() {
		return new TenantsStore();
	}

	products() {
		return new ProductsStore();
	}
}

export default function () {
	return new DataStores();
}

