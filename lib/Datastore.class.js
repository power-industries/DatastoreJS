const Type = require('@power-industries/typejs');
const cloneDeep = require('lodash.clonedeep');
const uuid = require('uuid').v4;

const Adapter = require('./Adapter/Adapter.class');

class Datastore {
	/**
	 *
	 * @param adapter {Adapter}
	 * @param config {Object}
	 * @param config.validate {Null | Function}
	 */
	constructor(adapter, config = {
		validate: null
	}) {
		if(!(adapter instanceof Adapter))
			throw new TypeError('Expected adapter to be a valid Adapter');

		if (!(config instanceof Type.Object))
			throw new TypeError('Expected config to be an Object');


		if(!(config.validate instanceof Type.Function || config.validate instanceof Type.Null))
			throw new TypeError('Expected config.validate to be a Function or Null');

		this._config = {
			adapter: adapter,
			validate: config.validate
		}

		this._data = new Map();

		this._config.adapter.init(this.serialize(this._data));
	}

	/**
	 * @param dataMap {Map}
	 * @returns {String}
	 */
	serialize(dataMap) {
		return JSON.stringify(Array.from(this._data.entries()));
	}

	/**
	 * @param dataString {String}
	 * @returns {Map}
	 */
	deserialize(dataString) {
		return new Map(JSON.parse(dataString));
	}

	read() {
		this._data = this.deserialize(this._config.adapter.read());
	}
	write() {
		this._config.adapter.write(this.serialize(this._data));
	}

	generateUUID() {
		let id = uuid();

		while (this._data.has(id))
			id = uuid();

		return id;
	}

	// Shortcuts
	insert(dataObject) {
		return this.insertOne(dataObject);
	}
	find(queryFunction) {
		return this.findOne(queryFunction);
	}
	filter(queryFunction) {
		return this.findMany(queryFunction);
	}
	findAll() {
		return this.filter(() => true);
	}
	update(queryFunction, updateFunction) {
		return this.updateOne(queryFunction, updateFunction);
	}
	delete(queryFunction) {
		return this.deleteOne(queryFunction);
	}

	// Insertion Methods
	insertOne(dataObject) {
		if (!(dataObject instanceof Type.Object))
			throw new TypeError('Expected data to be an Object');

		if(!this._config.validate(dataObject))
			throw new TypeError('Expected dataObject to be correct according to verifyFunction');

		let metaDataObject = {
			_id: this.generateUUID(),
			_createdAt: Date.now(),
			_modifiedAt: Date.now()
		};

		this._data.set(metaDataObject._id, {...cloneDeep(dataObject), ...metaDataObject});

		return cloneDeep(this._data.get(metaDataObject._id));
	}
	insertMany(dataObjectArray) {
		if(!(dataObjectArray instanceof Type.Array))
			throw new TypeError('Expected dataObjectArray to be an Array');

		dataObjectArray.forEach((dataObject) => {
			if(!(dataObject instanceof Type.Object))
				throw new TypeError('Expected dataObjectArray to be an Array of Objects');

			if(!this._config.validate(dataObject))
				throw new TypeError('Expected dataObject to be correct according to verifyFunction');
		});

		return dataObjectArray.map(dataObject => this.insertOne(dataObject));
	}

	// Query Methods
	findOne(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be a Function');

		const data = cloneDeep(this._data)

		return cloneDeep(Array.from(this._data.values())
			.find(record => queryFunction(cloneDeep(record), record._id, data)));
	}
	findMany(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be an Object Schema or a Function');

		const data = cloneDeep(this._data);

		return cloneDeep(Array.from(this._data.values())
			.filter(record => queryFunction(cloneDeep(record), record._id, data)));
	}

	// Update Methods
	updateOne(queryFunction, updateFunction) {
		if(!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		if (!(updateFunction instanceof Type.Function))
			throw new TypeError('Expected updateFunction to be a Function');

		let record = this.findOne(queryFunction);

		if (record instanceof Type.Undefined)
			return undefined;

		let metaDataObject = {
			_id: record._id,
			_createdAt: record._createdAt,
			_modifiedAt: Date.now()
		};

		let updatedRecord = updateFunction(record);

		if(!(updatedRecord instanceof Type.Object))
			throw new TypeError('Expected updatedRecord to be an Object');

		if(!this._config.validate(updatedRecord))
			throw new TypeError('Expected updatedRecord to be correct according to verifyFunction');

		this._data.set(metaDataObject._id, {...cloneDeep(updatedRecord), ...metaDataObject});

		return cloneDeep(this._data.get(metaDataObject._id));
	}
	updateMany(queryFunction, updateFunction) {
		if(!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		if (!(updateFunction instanceof Type.Function))
			throw new TypeError('Expected updateFunction to be a Function');

		let recordArray = this.findMany(queryFunction);

		return recordArray.map(record => {
			let metaDataObject = {
				_id: record._id,
				_createdAt: record._createdAt,
				_modifiedAt: Date.now()
			};

			let updatedRecord = updateFunction(record);

			if(!(updatedRecord instanceof Type.Object))
				throw new TypeError('Expected updatedRecord to be an Object');

			if(!this._config.validate(updatedRecord))
				throw new TypeError('Expected updatedRecord to be correct according to verifyFunction');

			this._data.set(metaDataObject._id, {...cloneDeep(updatedRecord), ...metaDataObject});

			return cloneDeep(this._data.get(metaDataObject._id));
		});
	}

	// Delete Methods
	deleteOne(queryFunction) {
		if(!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let record = this.findOne(queryFunction);

		if (record instanceof Type.Undefined)
			return undefined;

		this._data.delete(record._id);

		return record;
	}
	deleteMany(queryFunction) {
		if(!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let recordArray = this.findMany(queryFunction);

		return recordArray.map(record => {
			this._data.delete(record._id);
			return record;
		});
	}
}

module.exports = Datastore;