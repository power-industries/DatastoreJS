const Type = require('@power-industries/typejs');

const Adapter = require('./Adapter.class');

class MemoryAdapter extends Adapter {
	constructor() {
		super();
		this._data = null;
	}

	/**
	 * @param data {String}
	 */
	init(data) {
		this.write(data);
	}

	/**
	 * @returns {String}
	 */
	read() {
		if(this._data instanceof Type.Null)
			throw new TypeError('Adapter not initialized');

		return this._data;
	}

	/**
	 * @param data {String}
	 */
	write(data) {
		if(!(data instanceof Type.String))
			throw new TypeError('Expected data to be a String');

		this._data = data;
	}
}

module.exports = MemoryAdapter;