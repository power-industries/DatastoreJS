const Type = require('@power-industries/typejs');
const Schema = require('@power-industries/schemajs');

class Config {
	#config = {
		schema: Schema.Any(),
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
	 * @returns {Object}
	 */
	export() {
		return this.#config;
	}
}

module.exports = Config;