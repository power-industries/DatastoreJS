const fs = require('fs');

const Type = require('@power-industries/typejs');
const {v4: uuid} = require('uuid');

const EJSON = require('./Util/EJSON.class');
const ejson = new EJSON(EJSON.defaultReviver, EJSON.defaultReplacer);

class Datastore {
	constructor(filename) {
		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		if(!fs.existsSync(this.#filename))
			this.writeSync();
		else
			this.readSync();
	}

	readSync() {
		let data = ejson.deserialize(fs.readFileSync(this.#filename, 'utf8'));

		Datastore.#checkIntegrity(data);

		this.#data = data;
	}
	read() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.#filename, 'utf8', (error, rawData) => {
				if(error)
					return reject(error);

				try {
					const data = ejson.deserialize(rawData);

					Datastore.#checkIntegrity(data);

					this.#data = data;

					return resolve();
				}
				catch (error) {
					return reject(error);
				}
			});
		});
	}

	writeSync() {
		fs.writeFileSync(this.#filename, ejson.serialize(this.#data), 'utf8');
	}
	write() {
		return new Promise((resolve, reject) => {
			let rawData = null;

			try {
				rawData = ejson.serialize(this.#data);
			}
			catch (error) {
				return reject(error);
			}

			fs.writeFile(this.#filename, rawData, 'utf8', (error) => {
				if(error)
					return reject(error);

				return resolve();
			});
		})
	}

	insert(data) {}
	find(f) {}
	filter(f) {}
	update(id, data) {}
	delete(id) {}

	#filename = null;
	#data = new Map();

	#generateUUID() {
		let id = uuid();

		while (this.#data.has(id))
			id = uuid();

		return id;
	}
	static #checkIntegrity(data) {
		if(!(data instanceof Map))
			throw new TypeError(`Expected data to be a Map`);

		data.forEach((value, key) => {
			if(!(key instanceof Type.String))
				throw new TypeError(`Expected key to be a String`);

			if (!(value instanceof Type.Object))
				throw new TypeError(`Expected data[${key}] to be an Object`);

			if(!(value.meta instanceof Type.Object))
				throw new TypeError(`Expected data[${key}].meta to be an Object`);

			if (!(value.meta._id instanceof Type.String))
				throw new TypeError(`Expected data[${key}].meta._id to be a String`);

			if (!Number.isSafeInteger(value.meta._createdAt))
				throw new TypeError(`Expected data[${key}].meta._createdAt to be a Number`);

			if (!Number.isSafeInteger(value.meta._modifiedAt))
				throw new TypeError(`Expected data[${key}].meta._modifiedAt to be a Number`);

			if(!('data' in value))
				throw new TypeError(`Expected data[${key}].data to exist`);
		});
	}
}

module.exports = Datastore;