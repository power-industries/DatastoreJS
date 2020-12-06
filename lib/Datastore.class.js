const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');
const { v4: uuid } = require('uuid');

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

	insert(value) {}
	find(value) {}
	filter(value) {}
	update(value) {}
	delete(value) {}
}

module.exports = Datastore;