const Type = require('@power-industries/typejs');
const Adapter = require('../Adapter/Adapter.class');
const Schema = require('@power-industries/schemajs');

class Config {
	#config = {
		adapter: null,
		schema: Schema.Any(),
		autoLoad: false,
		autoIntegrity: false,
		mapOnStartup: data => data,
		beforeDeserialization: data => data,
		afterSerialization: data => data
	}

	/**
	 * @param adapter {Adapter}
	 */
	constructor(adapter) {
		if (!(adapter instanceof Adapter))
			throw new TypeError('Expected adapter to be a valid Adapter');

		this.#config.adapter = adapter;
	}

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
	 * @param f {Function}
	 * @returns {Config}
	 */
	mapOnStartup(f) {
		if (!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		this.#config.mapOnStartup = f;

		return this;
	}

	/**
	 * @param f {Function}
	 * @returns {Config}
	 */
	beforeDeserialization(f) {
		if (!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		this.#config.beforeDeserialization = f;

		return this;
	}

	/**
	 * @param f {Function}
	 * @returns {Config}
	 */
	afterSerialization(f) {
		if (!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		this.#config.afterSerialization = f;

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