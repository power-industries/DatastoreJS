const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');
const { v4: uuid } = require('uuid');
const Record = require('./Record.class');
const cloneDeep = require('lodash.clonedeep');

const Adapter = require('./Adapters/Adapter.class');

class Datastore {
	constructor(adapter,
				schema = Schema.Any(),
				autoLoad = false,
				autoIntegrity = false,
				errorHandler = (error, data) => {
					throw error;
				}) {
		if(!(adapter instanceof Adapter))
			throw new TypeError('Expected adapter to be a valid Adapter');

		if(!(schema instanceof Schema.Schema.Validator))
			throw new TypeError('Expected schema to be a valid Schema');

		if(!(autoLoad instanceof Type.Boolean))
			throw new TypeError('Expected autoLoad to be a Boolean');

		if(!(autoIntegrity instanceof Type.Boolean))
			throw new TypeError('Expected autoIntegrity to be a Boolean');

		if(!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		this._data = new Map();

		this._config = {
			adapter,
			schema,
			autoLoad,
			autoIntegrity,
			errorHandler
		};
		this._autoWrite = {
			active: false,
			reference: null
		};
	}

	read() {}
	write() {}

	checkIntegrity() {}

	startAutoWrite() {}
	stopAutoWrite() {}

	insert(data) {
		let result = this._config.schema.parseSync(cloneDeep(data));
		let id = uuid();

		while(this._data.has(id))
			id = uuid();

		this._data.set(id, new Record(id, Date.now(), Date.now(), result));

		return id;
	}
	insertRecord(record) {
		if(!(record instanceof Record))
			throw new TypeError('Expected record to be a Record');

		let id = record.meta.id;

		if(this._data.has(id))
			throw new ReferenceError('Record already exists');

		let result = this._config.schema.parseSync(cloneDeep(record.data));

		this._data.set(id, new Record(id, record.meta.createdAt, record.meta.modifiedAt, result));

		return id;
	}
	find(query) {
		if(query instanceof Schema.Schema.Validator) {
			return this._data.get(Array.from(this._data.keys()).find(key => {
				return query.validateSync(cloneDeep(this._data.get(key).data));
			}));
		}
		else if(query instanceof Type.Function) {
			return this._data.get(Array.from(this._data.keys()).find(key => {
				try {
					return query(this._data.get(key).data, key, this._data);
				}
				catch (error) {
					return false;
				}
			}));
		}
		else
			throw new TypeError('Expected query to be a Schema or a Function');
	}
	filter(query) {
		if(query instanceof Schema.Schema.Validator) {
			return Array.from(this._data.keys()).filter(key => query.validateSync(cloneDeep(this._data.get(key).data))).map(key => this._data.get(key));
		}
		else if(query instanceof Type.Function) {
			return Array.from(this._data.keys()).filter(key => {
				try {
					return query(this._data.get(key).data, key, this._data)
				}
				catch (error) {
					return false;
				}
			}).map(key => this._data.get(key));
		}
		else
			throw new TypeError('Expected query to be a Schema or a Function');
	}
	update(query, data) {
		let key = null;
		let result = this._config.schema.parseSync(data);

		if(query instanceof Schema.Schema.Validator) {
			key = Array.from(this._data.keys()).find(key => {
				return this._config.schema.validateSync(cloneDeep(this._data.get(key).data));
			});
		}
		else if(query instanceof Type.Function) {
			key = Array.from(this._data.keys()).find(key => {
				return query(this._data.get(key).data, key, this._data);
			});
		}
		else
			throw new TypeError('Expected query to be a Schema or a Function');

		if (!(key instanceof Type.Undefined)) {
			this._data.set(key, new Record(key, this._data.get(key).meta.createdAt, Date.now(), cloneDeep(result)));
			return this._data.get(key);
		}
		else {
			return undefined;
		}

	}
	delete(query) {
		let key = null;

		if(query instanceof Schema.Schema.Validator) {
			key = Array.from(this._data.keys()).find(key => {
				return query.validateSync(cloneDeep(this._data.get(key).data));
			});
		}
		else if(query instanceof Type.Function) {
			key = Array.from(this._data.keys()).find(key => {
				return query(this._data.get(key).data, key, this._data);
			});
		}
		else
			throw new TypeError('Expected query to be a Schema or a Function');

		if (!(key instanceof Type.Undefined))
			this._data.delete(key);
	}
}

module.exports = Datastore;