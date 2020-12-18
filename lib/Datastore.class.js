const Type = require('@power-industries/typejs');
const uuid = require('uuid').v4;
const dMap = require('./Util/dMap.class');

const Adapter = require('./Adapter/Adapter.class');

const Config = require('./Util/Config.class');

class Datastore {
	// Private Properties
	#config = {
		adapter: null,
		validate: null,
		autoLoad: false,
		autoIntegrity: false,
		mapOnStartup: null,
		beforeDeserialization: null,
		afterSerialization: null,
		autoWrite: {
			active: false,
			reference: null
		}
	}
	#data = new dMap();

	// Private Methods
	#serialize() {
		let serialData = this.#config.afterSerialization(JSON.stringify(this.#data.entries()));

		if(!(serialData instanceof Type.String))
			throw new TypeError('Expected serialData to be a String');

		return serialData;
	}
	#deserialize(dataString) {
		if(!(dataString instanceof Type.String))
			throw new TypeError('Expected dataString to be a String');

		let serialData = this.#config.beforeDeserialization(dataString);

		if(!(serialData instanceof Type.String))
			throw new TypeError('Expected serialData to be a String');

		this.#data = new dMap(JSON.parse(serialData));
	}
	#generateUUID() {
		let id = uuid();

		while (this.#data.has(id))
			id = uuid();

		return id;
	}
	#checkIntegrity() {
		if(!(this.#data instanceof dMap))
			throw new TypeError('Expected data to be a dMap');

		this.#data.keys().forEach(key => {
			if(!(key instanceof Type.String))
				throw new TypeError(`Expected key to be a String`);

			if (!(this.#data.get(key) instanceof Type.Object))
				throw new TypeError(`Expected data[${key}] to be an Object`);

			let {_id, _createdAt, _modifiedAt, ...data} = this.#data.get(key);

			if (_id instanceof Type.String)
				throw new TypeError(`Expected data[${key}]._id to be a String`);

			if (_createdAt instanceof Type.Number)
				throw new TypeError(`Expected data[${key}]._createdAt to be a Number`);

			if (_modifiedAt instanceof Type.Number)
				throw new TypeError(`Expected data[${key}]._modifiedAt to be a Number`);

			if (!this.#config.validate(data))
				throw new TypeError(`Expected data[${key}] to be valid`);
		});
	}

	// Constructor
	constructor(config) {
		// Parameter checking
		{
			if (!(config instanceof Config))
				throw new TypeError('Expected config to be a valid Configuration Instance');
		}

		// Configuration Setup & Sanitation
		{
			this.#config = {...config.export(), ...{autoWrite: {active: false, reference: null}}};
		}

		// Datastore Initialization
		{
			this.#config.adapter.init(this.#serialize());

			if(this.#config.autoLoad) {
				this.#deserialize(this.#config.adapter.read());

				this.#data = new dMap(this.#config.mapOnStartup(this.#data.entries()));

				if(this.#config.autoIntegrity || this.#config.mapOnStartup)
					this.#checkIntegrity();
			}
		}
	}

	// Persistence
	read() {
		this.#deserialize(this.#config.adapter.read());

		if(this.#config.autoIntegrity)
			this.#checkIntegrity();
	}
	write() {
		this.#config.adapter.write(this.#serialize());
	}

	// Auto-Persistence
	startAutoWrite(interval = 5, errorHandler = (error, data) => {throw error;}) {
		if(!(interval instanceof Type.Number))
			throw new TypeError('Expected interval to be a Number');

		if(!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		if(this.#config.autoWrite.active)
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
	insertOne(dataObject) {
		// Parameter checking
		{
			if (!(dataObject instanceof Type.Object))
				throw new TypeError('Expected dataObject to be an Object');

			if (!this.#config.validate(dataObject))
				throw new TypeError('Invalid dataObject');
		}

		let metaData = {
			_id: this.#generateUUID(),
			_createdAt: Date.now(),
			_modifiedAt: Date.now()
		};

		this.#data.set(metaData._id, {...dataObject, ...metaData});

		return this.#data.get(metaData._id);
	}
	insertMany(dataObjectArray) {
		// Parameter checking
		{
			if (!(dataObjectArray instanceof Type.Array))
				throw new TypeError('Expected dataObjectArray to be an Array');

			dataObjectArray.forEach((dataObject, index) => {
				if (!(dataObject instanceof Type.Object))
					throw new TypeError(`Expected dataObjectArray[${index}] to be an Object`);

				if (!this.#config.validate(dataObject))
					throw new TypeError(`Invalid dataObjectArray[${index}]`);
			});
		}

		return dataObjectArray.map(dataObject => {
			let metaData = {
				_id: this.#generateUUID(),
				_createdAt: Date.now(),
				_modifiedAt: Date.now()
			};

			this.#data.set(metaData._id, {...dataObject, ...metaData});

			return this.#data.get(metaData._id);
		});
	}
	findOne(queryFunction) {
		// Parameter checking
		{
			if (!(queryFunction instanceof Type.Function))
				throw new TypeError('Expected query to be a Function');
		}

		const result = this.#data.values()
			.find(record => queryFunction(record));

		return result ? result : null;
	}
	findMany(queryFunction) {
		// Parameter checking
		{
			if (!(queryFunction instanceof Type.Function))
				throw new TypeError('Expected query to be an Object Schema or a Function');
		}

		return this.#data.values()
			.filter(record => queryFunction(record));
	}
	getOne(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		return this.#data.has(id) ? this.#data.get(id) : null;
	}
	getMany(idArray) {
		if(!(idArray instanceof Type.Array))
			throw new TypeError('Expected idArray to be an Array');

		idArray.forEach(id => {
			if(!(id instanceof Type.String))
				throw new TypeError('Expected idArray to be an Array of Strings');
		});

		return idArray.map(id => {
			this.#data.has(id) ? this.#data.get(id) : null
		});
	}
	updateOne(queryFunction, updateFunction) {
		// Parameter checking
		{
			if (!(queryFunction instanceof Type.Function))
				throw new TypeError('Expected queryFunction to be a Function');

			if (!(updateFunction instanceof Type.Function))
				throw new TypeError('Expected updateFunction to be a Function');
		}

		const record = this.findOne(queryFunction);

		if (!record)
			return null;

		let metaData = {
			_id: record._id,
			_createdAt: record._createdAt,
			_modifiedAt: Date.now()
		};

		let updatedRecord = updateFunction(record);

		if (!(updatedRecord instanceof Type.Object))
			throw new TypeError('Expected updatedRecord to be an Object');

		if (!this.#config.validate(updatedRecord))
			throw new TypeError('Invalid updatedRecord');

		this.#data.set(metaData._id, {...updatedRecord, ...metaData});

		return this.#data.get(metaData._id);
	}
	updateMany(queryFunction, updateFunction) {
		// Parameter checking
		{
			if (!(queryFunction instanceof Type.Function))
				throw new TypeError('Expected queryFunction to be a Function');

			if (!(updateFunction instanceof Type.Function))
				throw new TypeError('Expected updateFunction to be a Function');
		}

		let recordArray = this.findMany(queryFunction);

		return recordArray.map(record => {
			let metaData = {
				_id: record._id,
				_createdAt: record._createdAt,
				_modifiedAt: Date.now()
			};

			let updatedRecord = updateFunction(record);

			if (!(updatedRecord instanceof Type.Object))
				throw new TypeError('Expected updatedRecord to be an Object');

			if (!this.#config.validate(updatedRecord))
				throw new TypeError('Invalid updatedRecord');

			this.#data.set(metaData._id, {...updatedRecord, ...metaData});

			return this.#data.get(metaData._id);
		});
	}
	deleteOne(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let record = this.findOne(queryFunction);

		if(!record)
			return null;

		this.#data.delete(record._id);

		return record;
	}
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