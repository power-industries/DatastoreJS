const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');

class Config {
	#config = {
		schema: Schema.Any(),
		autoLoad: false,
		autoIntegrity: false,
	}

	constructor() {}

	/**
	 * @param schema {Validator}
	 * @returns {Config}
	 */
	schema(schema) {
		if (!(schema instanceof Schema.Schema.Validator))
			throw new TypeError('Expected schema to be a Schema');

		this.#config.schema = schema;

		return this;
	}

	/**
	 * @param value {Boolean}
	 * @returns {Config}
	 */
	autoLoad(value = true) {
		if(!(value instanceof Type.Boolean))
			throw new TypeError('Expected value to be a Boolean');

		this.#config.autoLoad = true;

		return this;
	}

	/**
	 * @param value {Boolean}
	 * @returns {Config}
	 */
	autoIntegrity(value = true) {
		if(!(value instanceof Type.Boolean))
			throw new TypeError('Expected value to be a Boolean');

		this.#config.autoIntegrity = true;

		return this;
	}

	/**
	 * @returns {Object}
	 */
	export() {
		return this.#config;
	}
}

module.exports = Config;