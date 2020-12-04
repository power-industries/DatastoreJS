const Type = require('@power-industries/typejs');
const fs = require('fs');
const Adapter = require('./Adapter.class');

class FileAdapter extends Adapter {
	/**
	 * @param filename {String}
	 */
	constructor(filename) {
		super(filename);
	}

	/**
	 * @returns {String}
	 */
	read() {
		return this._beforeDeserialization(fs.readFileSync(this._uri, 'utf8'));
	}

	/**
	 * @param data {String}
	 * @throws {TypeError}
	 */
	write(data) {
		if(data instanceof Type.String)
			throw new TypeError('Expected data to be a String');

		fs.writeFileSync(this._uri, this._afterSerialization(data), 'utf8');
	}
}

module.exports = FileAdapter;