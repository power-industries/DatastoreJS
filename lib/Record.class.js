const clone = require('./Util/clone.function');
const {v4: uuid} = require('uuid');

/**
 * @typedef metaObject {Object}
 * @property id {String}
 * @property createdAt {Number}
 * @property modifiedAt {Number}
 */

class Record {
	/**
	 * Create a new Record
	 * @param data {*}
	 * @param meta {String | metaObject} - String represents the ID, Object represents the metaData
	 */
	constructor(data, meta = uuid()) {
		if(typeof meta === 'string') {
			this.#meta.id = meta;
		}
		else if(Object.prototype.toString.call(meta) === '[object Object]') {
			if(!(typeof meta.id === 'string'))
				throw new TypeError('Expected meta.id to be a String');

			if(!Number.isSafeInteger(meta.createdAt))
				throw new TypeError('Expected meta.createdAt to be an Integer');

			if(!Number.isSafeInteger(meta.modifiedAt))
				throw new TypeError('Expected meta.modifiedAt to be an Integer');

			this.#meta = clone(meta);
		}
		else
			throw new TypeError('Expected meta to be a String or an Object');

		this.#data = clone(data);
	}

	/**
	 * Update the Data
	 * @param data {*}
	 */
	set data(data) {
		this.#meta.modifiedAt = Date.now();
		this.#data = clone(data);
	}

	/**
	 * Get the Data
	 * @returns {*}
	 */
	get data() {
		return clone(this.#data);
	}

	/**
	 * Get the MetaData Object
	 * @returns {metaObject}
	 */
	get meta() {
		return clone(this.#meta);
	}

	/**
	 * Get the Records ID
	 * @return {String}
	 */
	get id() {
		return this.#meta.id;
	}

	/**
	 * If the Record identifies itself with the given Function
	 * @param f {Function}
	 * @return {Boolean}
	 */
	ident(f) {
		if(!(typeof f === 'function'))
			throw new TypeError('Expected f to be a Function');

		return f(clone(this.#data), clone(this.#meta));
	}

	/**
	 * Returns a copy of the current Record
	 * @constructor
	 * @return {Record}
	 */
	clone() {
		return new Record(this.#data, this.#meta);
	}

	/**
	 * The Data of the Record
	 * @private
	 * @type {*}
	 */
	#data = null;
	/**
	 * The MetaData of the Record
	 * @private
	 * @type {metaObject}
	 */
	#meta = {
		id: uuid(),
		createdAt: Date.now(),
		modifiedAt: Date.now()
	};
}