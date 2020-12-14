const fs = require("fs");
const path = require("path");

const Type = require('@power-industries/typejs');

const Adapter = require('./Adapter.class');

class FileAdapter extends Adapter {
	/**
	 * @type {Boolean}
	 * @private
	 */
	#initialized = false;
	/**
	 * @type {String}
	 * @private
	 */
	#filename = "";

	/**
	 * @param filename {String}
	 */
	constructor(filename) {
		super();

		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		this.#filename = filename;
	}

	/**
	 * @param data {String}
	 */
	init(data) {
		if(this.#initialized)
			throw new Error('Adapter already initialized');

		if (!fs.existsSync(this.#filename)) {
			fs.mkdirSync(path.dirname(this.#filename), {recursive: true});
			fs.writeFileSync(this.#filename, data, 'utf8');
		}

		this.#initialized = true;
	}

	/**
	 * @returns {String}
	 */
	read() {
		if(!this.#initialized)
			throw new TypeError('Adapter not initialized');

		return fs.readFileSync(this.#filename, 'utf8');
	}

	/**
	 * @param data {String}
	 */
	write(data) {
		if(!this.#initialized)
			throw new Error('Adapter not initialized');

		if(!(data instanceof Type.String))
			throw new TypeError('Expected data to be a String');

		fs.mkdirSync(path.dirname(this.#filename), {recursive: true});
		fs.writeFileSync(this.#filename, data, 'utf8');
	}
}

module.exports = FileAdapter;