const cloneDeep = require('lodash.clonedeep');

class dMap extends Map {
	/**
	 * @param K {*}
	 * @param V {*}
	 * @returns {Map}
	 */
	set(K, V) {
		return super.set(K, cloneDeep(V));
	}

	/**
	 * @param K {*}
	 * @returns {*}
	 */
	get(K) {
		return cloneDeep(super.get(K));
	}

	/**
	 * @param K {*}
	 * @returns {Boolean}
	 */
	has(K) {
		return super.has(K);
	}

	/**
	 * @returns {Array<*>}
	 */
	keys() {
		return cloneDeep(Array.from(super.keys()));
	}

	/**
	 * @returns {Array<*>}
	 */
	values() {
		return cloneDeep(Array.from(super.values()));
	}

	/**
	 * @returns {Array<*>}
	 */
	entries() {
		return cloneDeep(Array.from(super.entries()));
	}
}

module.exports = dMap;