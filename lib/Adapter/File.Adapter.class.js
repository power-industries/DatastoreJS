const fs = require("fs");
const path = require("path");

const Type = require('@power-industries/typejs');

const Adapter = require('./Adapter.class');

class FileAdapter extends Adapter {
	/**
	 * @param filename {String}
	 */
	constructor(filename) {
		super();

		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		this._filename = filename;
	}

	/**
	 * @param data {String}
	 */
	init(data) {
		if (!fs.existsSync(this._filename))
			this.write(data);
	}

	/**
	 * @returns {String}
	 */
	read() {
		if(this._data instanceof Type.Null)
			throw new TypeError('Adapter not initialized');

		return fs.readFileSync(this._filename, 'utf8');
	}

	/**
	 * @param data {String}
	 */
	write(data) {
		if(!(data instanceof Type.String))
			throw new TypeError('Expected data to be a String');

		fs.mkdirSync(path.dirname(this._filename), {recursive: true});
		fs.writeFileSync(this._filename, data, 'utf8');
	}
}

module.exports = FileAdapter;