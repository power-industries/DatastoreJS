const Type = require('@power-industries/typejs');

const Adapter = require('./Adapter.class');

class MemoryAdapter extends Adapter {
	/**
	 * @type {Boolean}
	 * @private
	 */
	#initialized = false;
	/**
	 * @type {String}
	 * @private
	 */
	#data = "";

	constructor() {
		super();
	}

	/**
	 * @param data {String}
	 */
	init(data) {
		if(this.#initialized)
			throw new Error('Adapter already initialized');

		this.#data = data;

		this.#initialized = true;
	}

	/**
	 * @returns {String}
	 */
	read() {
		if(!this.#initialized)
			throw new TypeError('Adapter not initialized');

		return this.#data;
	}

	/**
	 * @param data {String}
	 */
	write(data) {
		if(!this.#initialized)
			throw new TypeError('Adapter not initialized');

		if(!(data instanceof Type.String))
			throw new TypeError('Expected data to be a String');

		this.#data = data;
	}
}

module.exports = MemoryAdapter;