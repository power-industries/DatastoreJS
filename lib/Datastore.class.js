const fs = require('fs');

const Type = require('@power-industries/typejs');
const {v4: uuid} = require('uuid');

const EJSON = require('./Util/EJSON.class');
const ejson = new EJSON(EJSON.defaultReviver, EJSON.defaultReplacer);

class Datastore {
	// Private Properties
	#config = {
		filename: null,
		autoWrite: {
			active: false,
			reference: null
		}
	}
	#data = new Map();

	// Private Methods
	#generateUUID() {
		let id = uuid();

		while (this.#data.has(id))
			id = uuid();

		return id;
	}
	static #checkIntegrity(data) {
		if(!(data instanceof Map))
			throw new TypeError('Expected data to be a dMap');

		data.forEach((value, key) => {
			if(!(key instanceof Type.String))
				throw new TypeError(`Expected key to be a String`);

			if (!(value instanceof Type.Object))
				throw new TypeError(`Expected data[${key}] to be an Object`);

			let {_id, _createdAt, _modifiedAt} = value;

			if (!(_id instanceof Type.String))
				throw new TypeError(`Expected data[${key}]._id to be a String`);

			if (!(_createdAt instanceof Type.Number))
				throw new TypeError(`Expected data[${key}]._createdAt to be a Number`);

			if (!(_modifiedAt instanceof Type.Number))
				throw new TypeError(`Expected data[${key}]._modifiedAt to be a Number`);
		});
	}

	// Constructor
	constructor(filename = "") {
		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		if(!fs.existsSync(this.#config.filename)) {
			this.writeSync();
		}
		else
			this.readSync();
	}

	// Persistence
	readSync() {
		let data = ejson.deserialize(fs.readFileSync(this.#config.filename, 'utf8'));

		Datastore.#checkIntegrity(data);

		this.#data = data;
	}
	writeSync() {
		fs.writeFileSync(this.#config.filename, ejson.serialize(this.#data), 'utf8');
	}

	// Auto-Persistence
	/**
	 * @param interval {Number}
	 * @param errorHandler {Function}
	 */
	startAutoWrite(interval = 5, errorHandler = (error, data) => {throw error;}) {
		if(!(interval instanceof Type.Number))
			throw new TypeError('Expected interval to be a Number');

		if(!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		this.stopAutoWrite();

		this.#config.autoWrite.reference = setInterval(() => {
			try {
				this.write();
			}
			catch(error) {
				errorHandler(error, this.#data.entries());
			}
		}, interval * 1000);
	}

	stopAutoWrite() {
		if(this.#config.autoWrite.active)
			clearInterval(this.#config.autoWrite.reference);
	}

	// Public CRUD Methods
	/**
	 * @param dataObject {Object}
	 * @returns {Object}
	 */
	insertOne(dataObject) {
		return this.insertMany([dataObject])[0];
	}

	/**
	 * @param dataObjectArray {Array<Object>}
	 * @returns {Array<Object>}
	 */
	insertMany(dataObjectArray) {
		// Parameter checking
		if (!(dataObjectArray instanceof Type.Array))
			throw new TypeError('Expected dataObjectArray to be an Array');

		return dataObjectArray
			// Deep Clone each dataObject to remove reference bugs
			.map(dataObject => {
				return ejson.copy(dataObject);
			})
			// Enrich each dataObject with MetaData
			.map(dataObject => {
				const metaData = {
					_id: this.#generateUUID(),
					_createdAt: Date.now(),
					_modifiedAt: Date.now()
				};

				return {...dataObject, ...metaData};
			})
			// Insert each dataObject
			.map(dataObject => {
				this.#data.set(dataObject._id, dataObject);

				return this.#data.get(dataObject._id);
			});
	}

	/**
	 * @param queryFunction {Function}
	 * @return {Object | null}
	 */
	findOne(queryFunction) {
		// Parameter checking
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be a Function');

		const result = this.#data.values()
			.find(record => queryFunction(record));

		return result ? result : null;
	}

	/**
	 * @param queryFunction {Function}
	 * @return {Array<Object>}
	 */
	findMany(queryFunction) {
		// Parameter checking
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be an Object Schema or a Function');

		return this.#data.values()
			.filter(record => queryFunction(record));
	}

	/**
	 * @param id {String}
	 * @return {Object | null}
	 */
	getOne(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		return this.#data.has(id) ? this.#data.get(id) : null;
	}

	/**
	 * @param queryFunction {Function}
	 * @param updateFunction {Function}
	 * @return {Object | null}
	 */
	updateOne(queryFunction, updateFunction) {
		// Parameter checking
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		if (!(updateFunction instanceof Type.Function))
			throw new TypeError('Expected updateFunction to be a Function');

		let record = this.findOne(queryFunction);

		if (!record)
			return null;

		const {_id, _createdAt, _modifiedAt, ...data} = record;

		record = {
			metaData: {
				_id: _id,
				_createdAt: _createdAt,
				_modifiedAt: Date.now()
			},
			data: data
		};

		record.data = updateFunction(record.data);

		if(!(record.data instanceof Type.Object))
			throw new TypeError('Expected result to be an Object');

		record = {...record.data, ...record.metaData};

		this.#data.set(record._id, record);

		return this.#data.get(record._id);
	}

	/**
	 * @param queryFunction {Function}
	 * @param updateFunction {Function}
	 * @return {Array<Object>}
	 */
	updateMany(queryFunction, updateFunction) {
		// Parameter checking
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		if (!(updateFunction instanceof Type.Function))
			throw new TypeError('Expected updateFunction to be a Function');

		return this.findMany(queryFunction)
			// Extract metaData from original record and rearrange Object
			.map(record => {
				const {_id, _createdAt, _modifiedAt, ...data} = record;

				return {
					metaData: {
						_id: _id,
						_createdAt: _createdAt,
						_modifiedAt: Date.now()
					},
					data: data
				};
			})
			// Update Object and check for Typing
			.map(record => {
				record.data = updateFunction(record.data);

				if(!(record.data instanceof Type.Object))
					throw new TypeError('Expected result to be an Object');

				return {...record.data, ...record.metaData};
			})
			// Insert each dataObject
			.map(record => {
				this.#data.set(record._id, record);

				return this.#data.get(record._id);
			});
	}

	/**
	 * @param queryFunction {Function}
	 * @return {Object | null}
	 */
	deleteOne(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let record = this.findOne(queryFunction);

		if(!record)
			return null;

		this.#data.delete(record._id);

		return record;
	}

	/**
	 * @param queryFunction {Function}
	 * @return {Array<Object>}
	 */
	deleteMany(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let recordArray = this.findMany(queryFunction);

		return recordArray.map(record => {
			this.#data.delete(record._id);

			return record;
		});
	}
}

module.exports = Datastore;