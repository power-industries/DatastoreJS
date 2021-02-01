const fs = require('fs');
const path = require('path');
const {v4: uuid} = require('uuid');
const clone = require('lodash.clonedeep');
const merge = require('lodash.merge');

/**
 * The metaData included in every Record
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

/**
 * @callback queryFunction
 * @param record {Record}
 * @param id {String}
 * @param data {Object<String, Record>}
 */

class Datastore {
	/**
	 * Create a new Datastore
	 * @param filename {String}
	 * @throws {TypeError} - Throws a TypeError if filename is not a String
	 */
	constructor(filename = "./data.json") {
		if(typeof filename !== 'string')
			throw new TypeError('Expected filename to be a String');

		this.#filename = filename;

		if(fs.existsSync(this.#filename))
			this.read();
		else
			this.write();
	}

	/**
	 * Reads the Datastore from the persistence file
	 * @returns {Datastore} - Returns this for Method Chaining
	 */
	read() {
		this.#data = Object.create(null, JSON.parse(fs.readFileSync(this.#filename, 'utf8')));

		return this;
	}

	/**
	 * Writes the Datastore to the persistence file
	 * @return {Datastore} - Return this for Method Chaining
	 */
	write() {
		fs.mkdirSync(path.dirname(this.#filename), {recursive: true});
		fs.writeFileSync(this.#filename, JSON.stringify(this.#data), 'utf8');

		return this;
	}

	/**
	 * Insert a new Record into the Datastore
	 * @param data {*} - The Data to insert
	 * @param [id] {String} - An optional unique String identifying the Record
	 * @returns {Record} - Returns a copy of the inserted Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if id is not unique
	 */
	insert(data, id = uuid()) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(Object.keys(this.#data).includes(id))
			throw new ReferenceError('Expected id to be a unique String');

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
	 * Find a single Record with a specific id
	 * @param id {String} - The id of the Record
	 * @returns {Record} - Returns a copy of the found Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if no Record with this id was found
	 */
	find(id) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('No Record found');

		return clone(this.#data[id]);
	}

	/**
	 * Filter for multiple Records based on a Function
	 * @param f {queryFunction} - The Function used for filtering
	 * @returns {Array<Record>} - Returns a copy of all Records matching f
	 * @throws {TypeError} - Throws a TypeError if f is not a Function
	 */
	filter(f) {
		if(typeof f !== 'function')
			throw new TypeError('Expected f to be a Function');

		const data = clone(this.#data);

		return Object.entries(data)
			.filter(([id, record]) => {
				return f(record, id, data);
			})
			.map(([, record]) => {
				return record;
			});
	}

	/**
	 * Update the data of a single Record with a specific id
	 * @param id {String} - The id of the Record
	 * @param data {*} - The Data to update the Records Data with
	 * @returns {Record} - Returns a copy of the modified Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if no Record with this id was found
	 */
	update(id, data) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('No Record found');

		this.#data[id].data = merge(clone(this.#data[id].data), clone(data));
		this.#data[id].meta.modifiedAt = Date.now();

		return clone(this.#data[id]);
	}

	/**
	 * Replace the data of a single Record with a specific id
	 * @param id {String} - The id of the Record
	 * @param data {*} - The Data to replace the Records Data with
	 * @returns {Record} - Returns a copy of the modified Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if no Record with this id was found
	 */
	replace(id, data) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('No Record found');

		this.#data[id].data = clone(data);
		this.#data[id].meta.modifiedAt = Date.now();

		return clone(this.#data[id]);
	}

	/**
	 * Delete a single Record with a specific id
	 * @param id {String} - The id of the Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if no Record with this id was found
	 */
	delete(id) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('No Record found');

		delete this.#data[id];
	}

	/**
	 * The Filename / Path for the Persistence File. Used by write/write and read/read
	 * @type {String}
	 */
	#filename = "./data.json";

	/**
	 * The central Data Object for this Datastore
	 * @type {Object<String, Record>}
	 */
	#data = Object.create(null);
}

module.exports = Datastore;