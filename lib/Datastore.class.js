const Type = require('@power-industries/typejs');
const uuid = require('uuid').v4;
const fs = require('fs');

class DS {
	// Private Properties
	#file = null;
	// Map of Records. Key equals _id
	#data = new Map();
	// Map of Collections. Key equals name, Value equals _id
	#col = new Map();

	#generateUUID() {
		let id = uuid();

		while (this.#data.has(id))
			id = uuid();

		return id;
	}
	#serialize() {
		return JSON.stringify({
			data: Array.from(this.#data.entries()),
			col: Array.from(this.#col.entries())
				.map(entry => [entry[0], Array.from(entry[1].values())])
		});
	}
	#deserialize(s) {
		let {data, col} = JSON.parse(s);

		this.#data = new Map(data.map(entry => [entry[0], new Set(entry[1])]));
		this.#col = new Map(col);
	}
	static #copy(data) {
		return JSON.parse(JSON.stringify(data));
	}

	constructor(file) {
		if (!(file instanceof Type.String))
			throw new TypeError('Expected file to be a String');

		this.#file = file;

		this.read();
	}

	read() {
		if(fs.existsSync(this.#file)) {
			this.#deserialize(fs.readFileSync(this.#config.file, 'utf8'));
		}
		else
			this.write();
	}
	write() {
		fs.writeFileSync(this.#file, this.#serialize());
	}

	insert(data) {
		let id = this.#generateUUID();

		this.#data.set(id, DS.#copy({
			data: data,
			meta: {
				id: id,
				createdAt: Date.now(),
				modifiedAt: Date.now()
			}
		}));
	}
	find(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be a Function');

		const result = this.#data.values()
			.find(record => queryFunction(record));

		return result ? DS.#copy(result) : null;
	}
	filter(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected query to be an Object Schema or a Function');

		const result = this.#data.values()
			.filter(record => queryFunction(record));

		return DS.#copy(result);
	}
	get(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		return this.#data.has(id) ? DS.#copy(this.#data.get(id)) : null;
	}
	update(queryFunction, updateFunction) {
		// Parameter checking
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		if (!(updateFunction instanceof Type.Function))
			throw new TypeError('Expected updateFunction to be a Function');

		let record = this.find(queryFunction);

		if (!record)
			return null;

		record = {
			meta: {
				id: record.meta.id,
				createdAt: record.meta.createdAt,
				modifiedAt: Date.now()
			},
			data: updateFunction(record.data)
		};

		this.#data.set(record.meta.id, DS.#copy(record));

		return DS.#copy(this.#data.get(record.id));
	}
	deleteOne(queryFunction) {
		if (!(queryFunction instanceof Type.Function))
			throw new TypeError('Expected queryFunction to be a Function');

		let record = this.find(queryFunction);

		if(!record)
			return null;

		this.#data.delete(record.meta.id);

		return record;
	}
}

module.exports = DS;