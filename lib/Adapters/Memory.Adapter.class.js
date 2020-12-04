const Type = require('@power-industries/typejs');
const Adapter = require('./Adapter.class');

class MemoryAdapter extends Adapter {
	constructor() {
		super();
		this._data = '';
	}

	/**
	 * @returns {String}
	 */
	read() {
		return this._beforeDeserialization(this._data);
	}

	/**
	 * @param data {String}
	 * @throws {TypeError}
	 */
	write(data) {
		if(data instanceof Type.String)
			throw new TypeError('Expected data to be a String');

		this._data = this._afterSerialization(data);
	}
}

module.exports = MemoryAdapter;