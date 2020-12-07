const { v4: uuid } = require('uuid');
const Type = require('@power-industries/typejs');

class Record {
	constructor(id = uuid(), createdAt = Date.now(), modifiedAt = Date.now(), data = {}) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		if(!(createdAt instanceof Type.Number))
			throw new TypeError('Expected createdAt to be a Number');

		if(!(modifiedAt instanceof Type.Number))
			throw new TypeError('Expected modifiedAt to be a Number');

		this._id = uuid();
		this._createdAt = Date.now();
		this._modifiedAt = Date.now();
		this._data = data;
	}

	get meta() {
		return {
			id: this._id,
			createdAt: this._createdAt,
			modifiedAt: this._modifiedAt
		};
	}
	get data() {
		return this._data;
	}
	set data(data) {
		this._data = data;
	}
}

module.exports = Record;