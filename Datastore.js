const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');
const { v4: uuid } = require('uuid');

const fs = require('fs');

class Datastore {
	constructor(filename, schema, autoLoad = false, errorHandler = (error) => {console.error(error);}) {
		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		if(!(schema instanceof Schema.Validator.Any))
			throw new TypeError('Expected schema to be a valid Schema');

		if(!(autoLoad instanceof Type.Boolean))
			throw new TypeError('Expected autoLoad to be a Boolean');

		if(!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		this._config = {
			filename,
			schema,
			documentSchema: Schema.Object()
				.required()
				.schema({
					_meta: Schema.Object()
						.required()
						.schema({
							id: Schema.String().required().matches(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/),
							createdAt: Schema.Number().required().integer().min(0),
							modifiedAt: Schema.Number().required().integer().min(0)
						}),
					data: schema
				}),
			autoLoad: {
				flag: autoLoad,
				errorHandler
			},
			autoWrite: {
				flag: false,
				interval: null,
				errorHandler: null,
				reference: null
			}
		};

		this._data = {};

		if(this._config.autoLoad.flag) {
			try {
				this.load();
			}
			catch(autoLoadError) {
				this._config.autoLoad.errorHandler(autoLoadError);
			}
		}
	}

	startAutoWrite(interval, errorHandler) {
		if(!(interval instanceof Type.Number && Number.isSafeInteger(interval) && interval > 0))
			throw new TypeError('Expected interval to be a positive Integer');

		if(!(errorHandler instanceof Type.Function))
			throw new TypeError('Expected errorHandler to be a Function');

		this._config.autoWrite.errorHandler = errorHandler;
		this._config.autoWrite.interval = interval * 1000;
		this._config.autoWrite.flag = true;

		this._config.autoWrite.reference = setInterval(() => {
			try {
				this.write();
			}
			catch(writeError) {
				errorHandler(this._data, writeError);
			}
		}, this._config.autoWrite.interval);

		return this;
	}
	stopAutoWrite() {
		if(this._config.autoWrite.flag)
			clearInterval(this._config.autoWrite.reference);
	}

	checkIntegrity() {
		if(this._data instanceof Type.Object) {
			const dataKeys = Object.keys(this._data);

			dataKeys.forEach(key => {
				if(!this._config.documentSchema.validateSync(this._data[key]))
					throw new Error('Integrity failed at Key ' + key);
			});

			dataKeys.forEach(key => {
				if(key !== this._data[key]._meta.id)
					throw new Error('Key mismatch at Key ' + key);
			});
		}
		else
			throw new TypeError('Expected data to be an Object');

		return this;
	}
	load() {
		this._data = JSON.parse(fs.readFileSync(this._config.filename, 'utf8'));

		this.checkIntegrity();

		return this;
	}
	write() {
		fs.writeFileSync(this._config.filename, JSON.stringify(this._data), 'utf8');

		return this;
	}

	getID() {
		let id = uuid();
		const idArray = Object.keys(this._data);

		while(id in idArray)
			id = uuid();

		return id;
	}

	insertOneSync(doc) {
		if(!this._config.schema.validateSync(doc))
			throw new Error('Expected doc to correspond to the Schema');

		let id = this.getID();

		this._data[id] = {
			_meta: {
				id: id,
				createdAt: Date.now(),
				modifiedAt: Date.now()
			},
			data: this._config.schema.parseSync(doc)
		};

		return id;
	}
	insertOne(doc) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.insertOneSync(doc));
			}
			catch(insertError) {
				return reject(insertError);
			}
		});
	}
	insertManySync(docArray) {
		if(!(docArray instanceof Type.Array))
			throw new TypeError('Expected docArray to be an Array of Documents');

		docArray.forEach(doc => {
			if(!this._config.schema.validateSync(doc))
				throw new Error('Expected doc to correspond to the Schema');
		});

		return docArray.reduce((result, doc) => {
			let id = this.getID();

			this._data[id] = {
				_meta: {
					id: id,
					createdAt: Date.now(),
					modifiedAt: Date.now()
				},
				data: this._config.schema.parseSync(doc)
			};

			result.push(id);

			return result;
		}, []);
	}
	insertMany(docArray) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.insertManySync(docArray));
			}
			catch(insertError) {
				return reject(insertError);
			}
		});
	}

	getOneByIDSync(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		if(!(id in Object.keys(this._data)))
			throw new Error('ID ' + id + ' not found');

		return this._data[id];
	}
	getOneByID(id) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.getOneByIDSync(id));
			}
			catch(findError) {
				return reject(findError);
			}
		});
	}
	getManyByIDSync(idArray) {
		if(!(idArray instanceof Type.Array))
			throw new TypeError('Expected idArray to be an Array of Strings');

		idArray.forEach(id => {
			if(!(id instanceof Type.String))
				throw new TypeError('Expected idArray to be an Array of Strings');
		});

		const keyArray = Object.keys(this._data);

		idArray.forEach(id => {
			if(!(id in keyArray))
				throw new Error('ID ' + id + ' not found');
		});

		return idArray.reduce((result, id) => {
			result.push(this._data[id]);
			return result;
		}, []);
	}
	getManyByID(idArray) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.getManyByIDSync(idArray));
			}
			catch(findError) {
				return reject(findError);
			}
		});
	}

	findOneSync(f) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		let result = Object.values(this._data).find(f);

		if(result instanceof Type.Undefined)
			throw new Error('No Document found');

		return result;
	}
	findOne(f) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.findOneSync(f));
			}
			catch(findError) {
				return reject(findError);
			}
		});
	}
	findManySync(f) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		return Object.values(this._data).filter(f);
	}
	findMany(f) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.findManySync(f));
			}
			catch(findError) {
				return reject(findError);
			}
		})
	}

	updateOneByIDSync(id, doc) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a valid ID');

		if(!this._config.schema.validateSync(doc))
			throw new Error('Expected doc to correspond to the Schema');

		if(!(id in Object.keys(this._data)))
			throw new Error('ID ' + id + ' not found');

		this._data[id].data = this._config.schema.parseSync(doc);
		this._data[id]._meta.modifiedAt = Date.now();

		return id;
	}
	updateOneByID(id, doc) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.updateOneByIDSync(id, doc));
			}
			catch(updateError) {
				return reject(updateError);
			}
		});
	}
	updateManyByIDSync(idArray, doc) {
		if(!(idArray instanceof Type.Array))
			throw new TypeError('Expected idArray to be an Array of Strings');

		idArray.forEach(id => {
			if(!(id instanceof Type.String))
				throw new TypeError('Expected idArray to be an Array of Strings');
		});

		if(!this._config.schema.validateSync(doc))
			throw new TypeError('Expected doc to correspond to the Schema');

		const keyArray = Object.keys(this._data);

		idArray.forEach(id => {
			if(!(id in keyArray))
				throw new Error('ID ' + id + ' not found');
		});

		const parsedDoc = this._config.schema.parseSync(doc);
		const updateTime = Date.now();

		return idArray.reduce((result, id) => {
			this._data[id].data = parsedDoc;
			this._data[id]._meta.modifiedAt = updateTime;

			result.push(id);
			return result;
		}, []);
	}
	updateManyByID(idArray, doc) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.updateManyByIDSync(idArray, doc));
			}
			catch(updateError) {
				return reject(updateError);
			}
		});
	}

	updateOneSync(f, doc) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		if(!this._config.schema.validateSync(doc))
			throw new Error('Expected doc to correspond to the Schema');

		let result = Object.values(this._data).find(f);

		if(result instanceof Type.Undefined)
			throw new Error('No Document found');

		let id = result._meta.id;

		this._data[id].data = this._config.schema.parseSync(doc);
		this._data[id]._meta.modifiedAt = Date.now();

		return id;
	}
	updateOne(f, doc) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.updateOneSync(f, doc));
			}
			catch(updateError) {
				return reject(updateError);
			}
		});
	}
	updateManySync(f, doc) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		if(!this._config.schema.validateSync(doc))
			throw new Error('Expected doc to correspond to the Schema');

		let idArray = Object.values(this._data).filter(f).map(result => result._meta.id);
		const parsedDoc = this._config.schema.parseSync(doc);
		const updateTime = Date.now();

		idArray.forEach(id => {
			this._data[id].data = parsedDoc;
			this._data[id]._meta.modifiedAt = updateTime;
		});

		return idArray;
	}
	updateMany(f, doc) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.updateManySync(f, doc));
			}
			catch(updateError) {
				return reject(updateError);
			}
		});
	}

	removeOneByIDSync(id) {
		if(!(id instanceof Type.String))
			throw new TypeError('Expected id to be a String');

		if(!(id in Object.keys(this._data)))
			throw new TypeError('ID ' + id + ' not found');

		delete this._data[id];

		return id;
	}
	removeOneByID(id) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.removeOneByIDSync(id));
			}
			catch(removeError) {
				return reject(removeError);
			}
		});
	}
	removeManyByIDSync(idArray) {
		if(!(idArray instanceof Type.Array))
			throw new TypeError('Expected idArray to be an Array of Strings');

		idArray.forEach(id => {
			if(!(id instanceof Type.String))
				throw new TypeError('Expected idArray to be an Array of Strings');
		});

		const keyArray = Object.keys(this._data);

		idArray.forEach(id => {
			if(!(id in keyArray))
				throw new Error('ID ' + id + ' not found');
		});

		idArray.forEach(id => {
			delete this._data[id];
		});

		return idArray;
	}
	removeManyByID(idArray) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.removeManyByIDSync(idArray));
			}
			catch(removeError) {
				return reject(removeError);
			}
		});
	}

	removeOneSync(f) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		let result = Object.values(this._data).find(f);

		if(result instanceof Type.Undefined)
			throw new TypeError('No Document found');

		let id = result._meta.id;

		delete this._data[id];

		return id;
	}
	removeOne(f) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.removeOneSync(f));
			}
			catch(removeError) {
				return reject(removeError);
			}
		});
	}
	removeManySync(f) {
		if(!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		return Object.values(this._data).filter(f).reduce((result, doc) => {
			result.push(doc._meta.id);
			delete this._data[doc._meta.id];
			return result;
		}, []);
	}
	removeMany(f) {
		return new Promise((resolve, reject) => {
			try {
				return resolve(this.removeManySync(f));
			}
			catch(removeError) {
				return reject(removeError);
			}
		});
	}
}

module.exports = Datastore;