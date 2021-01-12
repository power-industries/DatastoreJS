const fs = require('fs');
const {v4: uuid} = require('uuid');
const clone = require('lodash.clonedeep');

/**
 * @typedef metaData {Object}
 * @property id {String}
 * @property createdAt {Number}
 * @property modifiedAt {Number}
 */

/**
 * @typedef Record {Object}
 * @property meta {metaData}
 * @property data {*}
 */

class Datastore {
	/**
	 * Create a new Datastore
	 * @param filename {String}
	 */
	constructor(filename = "./data.json") {
		if(typeof filename !== 'string')
			throw new TypeError('Expected filename to be a String');

		this.#filename = filename;

		if(fs.existsSync(this.#filename))
			this.readSync();
		else
			this.writeSync();
	}

	/**
	 * Reads the Datastore from the persistence File asynchronously
	 */
	readSync() {
		let data = JSON.parse(fs.readFileSync(this.#filename, 'utf8'));

		Datastore.#checkIntegrity(data);

		this.#data = Object.create(null, data);
	}

	/**
	 * Reads the Datastore from the persistence File asynchronously
	 * @returns {Promise<undefined>}
	 */
	read() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.#filename, 'utf8', (error, data) => {
				if(error)
					return reject(error);

				try {
					let parsedData = JSON.parse(data);

					Datastore.#checkIntegrity(parsedData);

					this.#data = Object.create(null, parsedData);

					return resolve();
				}
				catch (error) {
					return reject(error);
				}
			});
		});
	}

	/**
	 * Writes the Datastore to the persistence File synchronously
	 */
	writeSync() {
		fs.writeFileSync(this.#filename, JSON.stringify(this.#data), 'utf8');
	}

	/**
	 * Reads the Datastore from the persistence File asynchronously
	 * @returns {Promise<undefined>}
	 */
	write() {
		return new Promise((resolve, reject) => {
			try {
				fs.writeFile(this.#filename, JSON.stringify(this.#data), 'utf8', error => {
					if (error)
						return reject(error);

					return resolve();
				});
			}
			catch (error) {
				return reject(error);
			}
		});
	}

	/**
	 * Insert a new Record into the Datastore
	 * @param data {*}
	 * @param id {String}
	 * @returns {Promise<Record>}
	 */
	insert(data, id = uuid()) {
		return new Promise((resolve, reject) => {
			if(typeof id !== 'string')
				return reject(new TypeError('Expected id to be a String'));

			if(Object.keys(this.#data).includes(id))
				return reject(new ReferenceError('ID already exists'));

			let obj = {
				meta: {
					id: id,
					createdAt: Date.now(),
					modifiedAt: Date.now()
				},
				data
			};

			this.#data[id] = clone(obj);

			return resolve(obj);
		});
	}

	/**
	 * Insert a new Record into the Datastore synchronously
	 * @param data {*}
	 * @param id {String}
	 * @returns {Record}
	 */
	insertSync(data, id = uuid()) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(Object.keys(this.#data).includes(id))
			throw new ReferenceError('ID already exists');

		let obj = {
			meta: {
				id: id,
				createdAt: Date.now(),
				modifiedAt: Date.now()
			},
			data
		};

		this.#data[id] = clone(obj);

		return obj;
	}

	/**
	 * Finds multiple Records in the Datastore
	 * @param f {Function}
	 * @returns {Promise<Array<Record>>}
	 */
	filter(f) {
		return new Promise((resolve, reject) => {
			if(typeof f !== 'function')
				return reject(new TypeError('Expected f to be a Function'));

			return resolve(clone(Object.values(this.#data)).filter(f));
		});
	}

	/**
	 * Finds multiple Records in the Datastore synchronously
	 * @param f {Function}
	 * @returns {Array<Record>}
	 */
	filterSync(f) {
		if(typeof f !== 'function')
			throw new TypeError('Expected f to be a Function');

		return clone(Object.values(this.#data)).filter(f);
	}

	/**
	 * Replace a single Record with new Data
	 * @param id {String}
	 * @param data {*}
	 * @returns {Promise<Record>}
	 */
	replace(id, data) {
		return new Promise((resolve, reject) => {
			if(typeof id !== 'string')
				return reject(new TypeError('Expected id to be a String'));

			if(!Object.keys(this.#data).includes(id))
				return reject(new ReferenceError('ID not found'));

			this.#data[id].data = clone(data);
			this.#data[id].meta.modifiedAt = Date.now();

			return resolve(clone(this.#data[id]));
		});
	}

	/**
	 * Replace a single Record with new Data synchronously
	 * @param id {String}
	 * @param data {*}
	 * @returns {Record}
	 */
	replaceSync(id, data) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('ID not found');

		this.#data[id].data = clone(data);
		this.#data[id].meta.modifiedAt = Date.now();

		return clone(this.#data[id]);
	}

	/**
	 * Deletes Records from the Datastore
	 * @param id {String}
	 * @returns {Promise<undefined>}
	 */
	delete(id) {
		return new Promise((resolve, reject) => {
			if(typeof id !== 'string')
				return reject(new TypeError('Expected id to be a String'));

			delete this.#data.id;

			return resolve();
		});
	}

	/**
	 * Deletes Records from the Datastore synchronously
	 * @param id {String}
	 */
	deleteSync(id) {
		if(typeof id !== 'string')
			return new TypeError('Expected id to be a String');

		delete this.#data.id;
	}

	/**
	 * @type {String}
	 */
	#filename = "./data.json";

	/**
	 * @type {Object<String, Record>}
	 */
	#data = Object.create(null);

	/**
	 * Check if the given data is a valid Datastore representation
	 * @param data {Object<String, Record>}
	 * @throws {Error} - Throws an Error if the Datastore representation is invalid
	 */
	static #checkIntegrity(data) {
		if(Object.prototype.toString.call(data) !== '[object Object]')
			throw new TypeError('Expected data to be an Object');

		Object.keys(data).forEach((key, index) => {
			if(typeof key !== 'string')
				throw new TypeError(`Expected key #${index} to be a String`);

			if(Object.prototype.toString.call(data[key]) !== '[object Object]')
				throw new TypeError(`Expected data[${key}] to be an Object`);

			if(Object.prototype.toString.call(data[key].meta) !== '[object Object]')
				throw new TypeError(`Expected data[${key}].meta to be an Object`);

			if(typeof data[key].meta.id !== 'string')
				throw new TypeError(`Expected data[${key}].meta.id to be a String`);

			if(!Number.isSafeInteger(data[key].meta.createdAt))
				throw new TypeError(`Expected data[${key}].meta.createdAt to be an Integer`);

			if(!Number.isSafeInteger(data[key].meta.modifiedAt))
				throw new TypeError(`Expected data[${key}].meta.modifiedAt to be an Integer`);

			if(data[key].meta.id !== key)
				throw new ReferenceError(`Expected data[${key}].meta.id to equal ${key}`);
		});
	}
}

module.exports = Datastore;