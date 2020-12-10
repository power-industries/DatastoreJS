const fs = require('fs');
const path = require('path');

const Type = require('@power-industries/typejs');
const cloneDeep = require('lodash.clonedeep');
const {v4: uuid} = require('uuid');

class Datastore {
	constructor(config = {
		filename: './data',
		verifyFunction: data => true
	}) {
		if (!(config instanceof Type.Object))
			throw new TypeError('Expected config to be an Object');

		if (!(config.filename instanceof Type.String))
			throw new TypeError('Expected config.filename to be a String');

		if(!(config.verifyFunction instanceof Type.Function))
			throw new TypeError('Expected config.verifyFunction to be a Function');

		this._config = config;
		this._data = new Map();
	}

	read() {
		let data = null;

		try {
			data = fs.readFileSync(this._config.filename, 'utf8');
		} catch (readError) {
			throw readError;
		}

		try {
			data = JSON.parse(data);
		} catch (parseError) {
			throw parseError;
		}

		this._data = new Map(data);
	}
	write() {
		let data = Array.from(this._data.entries());

		try {
			data = JSON.stringify(data);
		} catch (stringifyError) {
			throw stringifyError;
		}

		try {
			fs.mkdirSync(path.dirname(this._config.filename), {recursive: true});
			fs.writeFileSync(this._config.filename, data, 'utf8');
		} catch (writeError) {
			throw writeError;
		}
	}

	generateUUID() {
		let id = uuid();

		while (this._data.has(id))
			id = uuid();

		return id;
	}

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

	insertOne(dataObject) {
		if (!(dataObject instanceof Type.Object))
			throw new TypeError('Expected data to be an Object');

		if(!this._config.verifyFunction(dataObject))
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

			if(!this._config.verifyFunction(dataObject))
				throw new TypeError('Expected dataObject to be correct according to verifyFunction');
		});

		return dataObjectArray.map(dataObject => this.insertOne(dataObject));
	}
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

		if(!this._config.verifyFunction(updatedRecord))
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

			if(!this._config.verifyFunction(updatedRecord))
				throw new TypeError('Expected updatedRecord to be correct according to verifyFunction');

			this._data.set(metaDataObject._id, {...cloneDeep(updatedRecord), ...metaDataObject});

			return cloneDeep(this._data.get(metaDataObject._id));
		});
	}

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