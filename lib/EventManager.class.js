const Type = require('@power-industries/typejs');
const {v4: uuid} = require('uuid');

class EventManager {
	constructor() {
		this._eventMap = new Map();
	}

	add(event) {
		if(!(event instanceof Type.Function))
			throw new TypeError('Expected event to be a Function');

		let id = uuid();

		while(this._eventMap.has(id))
			id = uuid();

		this._eventMap.set(id, event);

		return id;
	}
	delete(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		if(this._eventMap.has(id))
			this._eventMap.delete(id);
	}

	getAll() {
		return this._eventMap;
	}

	execute(...params) {
		this._eventMap.forEach((value, key) => {
			value(key, params);
		});
	}
}

module.exports = EventManager;