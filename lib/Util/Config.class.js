const Type = require('@power-industries/typejs');
const Adapter = require('../Adapter/Adapter.class');

class Config {
	#config = {
		adapter: null,
		validate: () => true,
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
	 * @param f {Function}
	 * @returns {Config}
	 */
	validate(f) {
		if (!(f instanceof Type.Function))
			throw new TypeError('Expected f to be a Function');

		this.#config.validate = f;

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
	beforeSerialization(f) {
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