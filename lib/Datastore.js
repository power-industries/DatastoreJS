const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');

const { v4: uuid } = require('uuid');

const isValidAdapter = (adapter) => {
	return adapter instanceof MemoryAdapter || adapter instanceof FileAdapter ? true : adapter instanceof Adapter &&
		adapter.read instanceof Type.Function &&
		adapter.write instanceof Type.Function;
}

class Datastore {
	constructor(adapter,
				schema = Schema.Any(),
				errorHandler = (data, error) => {
					console.error(error);
				},
				autoLoad = false,
				autoIntegrity = false,
				beforeDeserialization = (data) => {
					return data;
				},
				afterSerialization = (data) => {
					return data;
				}
	) {
		if (!isValidAdapter(adapter))
			throw new TypeError('Expected adapter to be a valid Adapter');

		if (!(schema instanceof Schema.Validator.Any))
			throw new TypeError('Expected schema to be a valid Schema');

		if (!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		if (!(autoLoad instanceof Type.Boolean))
			throw new TypeError('Expected autoLoad to be a Boolean');

		if (!(autoIntegrity instanceof Type.Boolean))
			throw new TypeError('Expected autoIntegrity to be a Boolean');

		if (!(beforeDeserialization instanceof Type.Function))
			throw new TypeError('Expected beforeSerialization to be a Function');

		if (!(afterSerialization instanceof Type.Function))
			throw new TypeError('Expected afterSerialization to be a Function');

		this._config = {
			adapter,
			schema,
			errorHandler,
			autoLoad,
			autoWrite: {
				active: false,
				reference: null,
			},
			autoIntegrity,
			beforeDeserialization,
			afterSerialization
		};


		this._data = {};
		this._globalEvents = {
			onLoad: {},
			onWrite: {},
			onAutoWrite: {},
			onIntegrity: {},
			onInsert: {},
			onFind: {},
			onUpdate: {},
			onDelete: {}
		};

		if (this._config.autoLoad) {
			try {
				this.load();
			} catch (autoLoadError) {
				this._config.errorHandler(null, autoLoadError);
			}
		}
	}

	startAutoWrite(interval) {
		if (this._config.autoWrite.active)
			this.stopAutoWrite();

		this._config.autoWrite.reference = setInterval(() => {
			try {
				this.write();

				Object.values(this._globalEvents.onAutoWrite).forEach(event => event());
			} catch (autoWriteError) {
				this._config.errorHandler(this._data, autoWriteError);
			}
		}, interval * 1000);

		this._config.autoWrite.active = true;

		return this;
	}
	stopAutoWrite() {
		if (this._config.autoWrite.active)
			clearInterval(this._config.autoWrite.reference);

		this._config.autoWrite.active = false;

		return this;
	}

	load() {
		this._data = JSON.parse(this._config.beforeDeserialization(this._config.adapter.read()));

		if (this._config.autoIntegrity) {
			this.checkIntegrity();
		}

		Object.values(this._globalEvents.onLoad).forEach(event => event());

		return this;
	}
	write() {
		this._config.adapter.write(this._config.afterSerialization(JSON.stringify(this._data)));

		Object.values(this._globalEvents.onWrite).forEach(event => event());

		return this;
	}

	checkIntegrity() {
		if (!(this._data instanceof Type.Object))
			throw new TypeError('Expected Datastore to be an Object of Records');

		const recordSchema = Schema.Object().required().schema({
			_meta: Schema.Object().required().schema({
				id: Schema.String().required().min(1),
				createdAt: Schema.Number().required().integer().min(0),
				modifiedAt: Schema.Number().required().integer().min(0)
			}),
			data: this._config.schema
		});

		Object.keys(this._data).forEach(key => {
			if (!recordSchema.validateSync(this._data[key]))
				throw new Error('Datastore Integrity failed at key ' + key);

			if (this._data[key]._meta.id !== key)
				throw new Error('ID mismatch at key ' + key);
		});

		Object.values(this._globalEvents.onAutoWrite).forEach(event => event());

		return this;
	}

	insert(record, id = uuid()) {
		return new Promise((resolve, reject) => {
			if(!(id instanceof Type.String))
				return reject(new TypeError('Expected id to be a String'));

			if(Object.keys(this._data).includes(id))
				return reject(new Error('ID already exists'));

			try {
				this._data[id] = {
					_meta: {
						id: id,
						createdAt: Date.now(),
						modifiedAt: Date.now()
					},
					data: this._config.schema.parseSync(record)
				};
			}
			catch(parseError) {
				return reject(parseError);
			}

			Object.values(this._globalEvents.onInsert).forEach(event => event(this._data[id]));

			return resolve(id);
		});
	}

	findByID(id) {
		return new Promise((resolve, reject) => {
			if(!(id instanceof Type.String))
				return reject(new TypeError('Expected id to be a String'));

			if(!Object.keys(this._data).includes(id))
				return reject(new Error('ID not found'));

			Object.values(this._globalEvents.onFind).forEach(event => event(this._data[id]));

			return resolve(this._data[id]);
		});
	}
	findOne(f) {
		return new Promise((resolve, reject) => {
			if(!(f instanceof Type.Function))
				return reject(new TypeError('Expected f to be a Function'));

			let result = Object.values(this._data).find(f);

			if(result instanceof Type.Undefined)
				return reject(new Error('No Record found'));

			Object.values(this._globalEvents.onFind).forEach(event => event(result));

			return resolve(result);
		});
	}
	findMany(f) {
		return new Promise((resolve, reject) => {
			if(!(f instanceof Type.Function))
				return reject(new TypeError('Expected f to be a Function'));

			let result = Object.values(this._data).filter(f);

			if(result.length === 0)
				return reject(new Error('No Record found'));

			Object.values(this._globalEvents.onFind).forEach(event => event(result));

			return resolve(result);
		});
	}

	updateByID(id, record) {
		return new Promise((resolve, reject) => {
			if(!(id instanceof Type.String))
				return reject(new TypeError('Expected id to be a String'));

			if(!Object.keys(this._data).includes(id))
				return reject(new Error('ID not found'));

			try {
				this._data[id] = {
					_meta: {
						id: this._data[id]._meta.id,
						createdAt: this._data[id]._meta.id,
						modifiedAt: Date.now()
					},
					data: this._config.schema.parseSync(record)
				};
			}
			catch(parseError) {
				return reject(parseError);
			}

			Object.values(this._globalEvents.onUpdate).forEach(event => event(this._data[id]));

			return resolve(id);
		});
	}
	updateOne(f, record) {
		return new Promise((resolve, reject) => {
			if(!(f instanceof Type.Function))
				return reject(new TypeError('Expected f to be a Function'));

			let result = Object.values(this._data).find(f);

			if(result instanceof Type.Undefined)
				return reject(new Error('No Record found'));
			else
				result = result._meta.id;

			try {
				this._data[result] = {
					_meta: {
						id: this._data[result]._meta.id,
						createdAt: this._data[result]._meta.id,
						modifiedAt: Date.now()
					},
					data: this._config.schema.parseSync(record)
				};
			}
			catch(parseError) {
				return reject(parseError);
			}

			Object.values(this._globalEvents.onUpdate).forEach(event => event(this._data[result]));

			return resolve(result);
		});
	}

	deleteByID(id) {
		return new Promise((resolve, reject) => {
			if(!(id instanceof Type.String))
				return reject(new TypeError('Expected id to be a String'));

			if(!Object.keys(this._data).includes(id))
				return reject(new Error('ID not found'));

			Object.values(this._globalEvents.onDelete).forEach(event => event(this._data[id]));

			delete this._data[id];

			return resolve(id);
		});
	}
	deleteOne(f) {
		return new Promise((resolve, reject) => {
			if(!(f instanceof Type.Function))
				return reject(new TypeError('Expected f to be a Function'));

			let result = Object.values(this._data).find(f);

			if(result instanceof Type.Undefined)
				return reject(new Error('No Record found'));

			Object.values(this._globalEvents.onDelete).forEach(event => event(result));

			delete this._data[result._meta.id];

			return resolve(result._meta.id);
		});
	}
	deleteMany(f) {
		return new Promise((resolve, reject) => {
			if(!(f instanceof Type.Function))
				return reject(new TypeError('Expected f to be a Function'));

			let result = Object.values(this._data).filter(f);

			if(result.length === 0)
				return reject(new Error('No Record found'));

			Object.values(this._globalEvents.onDelete).forEach(event => event(result));

			result.forEach(element => {
				delete this._data[element._meta.id];
			});

			return resolve(result.map(element => element._meta.id));
		});
	}

	setGlobalEvent(type, event) {
		if (!(type instanceof Type.String))
			throw new TypeError('Expected type to be a String');

		if (!(event instanceof Type.Function))
			throw new TypeError('Expected event to be a Function');

		let eventID = uuid();

		switch (type) {
			case 'onLoad':
				this._globalEvents.onLoad[eventID] = event;

				break;
			case 'onWrite':
				this._globalEvents.onWrite[eventID] = event;

				break;
			case 'onAutoWrite':
				this._globalEvents.onAutoWrite[eventID] = event;

				break;
			case 'onIntegrity':
				this._globalEvents.onIntegrity[eventID] = event;

				break;
			case 'onInsert':
				this._globalEvents.onInsert[eventID] = event;

				break;
			case 'onFind':
				this._globalEvents.onFind[eventID] = event;

				break;
			case 'onUpdate':
				this._globalEvents.onUpdate[eventID] = event;

				break;
			case 'onDelete':
				this._globalEvents.onDelete[eventID] = event;

				break;
			default:
				throw new TypeError('Expected type to be a valid Event Type');
		}

		return eventID;
	}
	clearGlobalEvent(id) {
		if (!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		Object.keys(this._globalEvents).forEach(eventType => {
			if (Object.keys(this._globalEvents[eventType]).includes(id))
				delete this._globalEvents[eventType][id];
		});
	}
	clearGlobalEvents() {
		this._globalEvents = {
			onLoad: {},
			onWrite: {},
			onAutoWrite: {},
			onIntegrity: {},
			onInsert: {},
			onFind: {},
			onUpdate: {},
			onDelete: {}
		};
	}

	get stats() {
		return {
			recordCount: Object.keys(this._data).length,
			eventCount: Object.keys(this._globalEvents).reduce((count, eventType) => {
				count += Object.keys(this._globalEvents[eventType]).length;

				return count;
			}, 0)
		}
	}
}

module.exports = Datastore;
