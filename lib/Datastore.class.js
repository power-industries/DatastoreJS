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
		this.#data = JSON.parse(fs.readFileSync(this.#filename, 'utf8'));

		this.#events.onRead.forEach(event => {
			event(clone(this.#data));
		});

		return this;
	}

	/**
	 * Writes the Datastore to the persistence file
	 * @return {Datastore} - Return this for Method Chaining
	 */
	write() {
		fs.mkdirSync(path.dirname(this.#filename), {recursive: true});
		fs.writeFileSync(this.#filename, JSON.stringify(this.#data), 'utf8');

		this.#events.onWrite.forEach(event => {
			event(clone(this.#data));
		});

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

		this.#events.onInsert.forEach(event => {
			event(clone(obj), id, clone(this.#data));
		});

		return obj;
	}

	/**
	 * Get a single Record with a specific id
	 * @param id {String} - The id of the Record
	 * @returns {Record} - Returns a copy of the found Record
	 * @throws {TypeError} - Throws a TypeError if id is not a String
	 * @throws {ReferenceError} - Throws a ReferenceError if no Record with this id was found
	 */
	get(id) {
		if(typeof id !== 'string')
			throw new TypeError('Expected id to be a String');

		if(!Object.keys(this.#data).includes(id))
			throw new ReferenceError('No Record found');

		this.#events.onGet.forEach(event => {
			event(clone(this.#data[id]), id, clone(this.#data));
		});

		return clone(this.#data[id]);
	}

	/**
	 * Find a single Record based on a Function
	 * @param f {queryFunction} - The Function used for filtering
	 * @returns {Record | null} - Returns a copy of the found Record or null if no Record was found
	 * @throws {TypeError} - Throws a TypeError if f is not a Function
	 */
	find(f) {
		if(typeof f !== 'function')
			throw new TypeError('Expected f to be a Function');

		const data = clone(this.#data);

		let result = Object.entries(data)
			.find(([id, record]) => {
				return f(record, id, data);
			});

		if(result === undefined)
			result = null;
		else
			result = result[1];

		this.#events.onFind.forEach(event => {
			event(clone(result), clone(this.#data));
		});

		return result;
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

		let result = Object.entries(data)
			.filter(([id, record]) => {
				return f(record, id, data);
			})
			.map(([, record]) => {
				return record;
			});

		this.#events.onFilter.forEach(event => {
			event(clone(result), clone(this.#data));
		});

		return result;
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

		this.#events.onUpdate.forEach(event => {
			event(clone(this.#data[id]), id, clone(this.#data));
		});

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

		this.#events.onReplace.forEach(event => {
			event(clone(this.#data[id]), id, clone(this.#data));
		});

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

		this.#events.onDelete.forEach(event => {
			event(clone(this.#data[id]), id, clone(this.#data));
		});

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
	#data = {};

	/**
	 *
	 * @type {Object<String, Set<Function>>}
	 */
	#events = {
		onRead: new Set(),
		onWrite: new Set(),
		onInsert: new Set(),
		onGet: new Set(),
		onFind: new Set(),
		onFilter: new Set(),
		onUpdate: new Set(),
		onReplace: new Set(),
		onDelete: new Set()
	}

	/**
	 * Add an Event Listener to a specific Type of Event
	 * Valid EventTypes are:
	 * * onRead
	 * * onWrite
	 * * onInsert
	 * * onGet
	 * * onFind
	 * * onFilter
	 * * onUpdate
	 * * onReplace
	 * * onDelete
	 *
	 * @param type {String} - The EventType
	 * @param listener {Function} - The Listener for the Event
	 * @returns {Datastore} - Returns this for Method Chaining
	 * @throws {TypeError} - Throws a TypeError if type is not a String
	 * @throws {TypeError} - Throws a TypeError if listener is not a Function
	 * @throws {RangeError} - Throws a RangeError if type is an invalid EventType
	 */
	addEventListener(type, listener) {
		if(typeof type !== 'string')
			throw new TypeError('Expected type to be a String');

		if(typeof listener !== 'function')
			throw new TypeError('Expected listener to be a Function');

		switch (type) {
			case 'onRead':
			case 'onWrite':
			case 'onInsert':
			case 'onGet':
			case 'onFind':
			case 'onFilter':
			case 'onUpdate':
			case 'onReplace':
			case 'onDelete':
				this.#events[type].add(listener);

				break;
			default:
				throw new RangeError('Expected type to be a valid EventType');
		}

		return this;
	}

	/**
	 * Remove an Event Listener from a specific Type of Event
	 * @param type {String} - The EventType
	 * @param listener {Function} - The Listener to remove
	 * @returns {boolean} - Returns false if the listener was not found, otherwise true
	 * @throws {TypeError} - Throws a TypeError if type is not a String
	 * @throws {TypeError} - Throws a TypeError if listener is not a Function
	 * @throws {RangeError} - Throws a RangeError if type is an invalid EventType
	 */
	removeEventListener(type, listener) {
		if(typeof type !== 'string')
			throw new TypeError('Expected type to be a String');

		if(typeof listener !== 'function')
			throw new TypeError('Expected listener to be a Function');

		switch (type) {
			case 'onRead':
			case 'onWrite':
			case 'onInsert':
			case 'onGet':
			case 'onFind':
			case 'onFilter':
			case 'onUpdate':
			case 'onReplace':
			case 'onDelete':
				return this.#events[type].delete(listener);
			default:
				throw new RangeError('Expected type to be a valid EventType');
		}
	}

	/**
	 * Clear all Event Listeners of a specific Type of Event
	 * @param type {String} - The EventType
	 * @throws {TypeError} - Throws a TypeError if type is not a String
	 * @throws {RangeError} - Throws a RangeError if type is an invalid EventType
	 */
	clearEventListeners(type) {
		if(typeof type !== 'string')
			throw new TypeError('Expected type to be a String');

		switch (type) {
			case 'onRead':
			case 'onWrite':
			case 'onInsert':
			case 'onGet':
			case 'onFind':
			case 'onFilter':
			case 'onUpdate':
			case 'onReplace':
			case 'onDelete':
				this.#events[type].clear();

				break;
			default:
				throw new TypeError('Expected type to be a valid EventType');
		}
	}
}

module.exports = Datastore;