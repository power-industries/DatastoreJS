const cloneDeep = require('lodash.clonedeep');

class dMap extends Map {
	set(K, V) {
		return super.set(K, cloneDeep(V));
	}

	get(K) {
		return cloneDeep(super.get(K));
	}

	has(K) {
		return super.has(K);
	}

	keys() {
		return cloneDeep(Array.from(super.keys()));
	}

	values() {
		return cloneDeep(Array.from(super.values()));
	}

	entries() {
		return cloneDeep(Array.from(super.entries()));
	}
}

module.exports = dMap;