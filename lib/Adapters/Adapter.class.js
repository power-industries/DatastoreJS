const Type = require('@power-industries/typejs');

class Adapter {
	/**
	 * @param uri {Null | String}
	 */
	constructor(uri = null) {
		if(!(uri instanceof Type.Null || uri instanceof Type.String))
			throw new TypeError('Expected uri to be a String or Null');

		if(!(defaultValue instanceof Type.String))
			throw new TypeError('Expected defaultValue to be a String');

		this._uri = uri;
		this._beforeDeserialization = data => data;
		this._afterSerialization = data => data;
		this._defaultValue = this._afterSerialization(defaultValue);
	}

	/**
	 * @param value {Function}
	 * @returns {Adapter}
	 */
	beforeDeserialization(value) {
		if(!(value instanceof Type.Function))
			throw new TypeError('Expected value to be a Function');

		this._beforeDeserialization = value;

		return this;
	}

	/**
	 * @param value {Function}
	 * @returns {Adapter}
	 */
	afterSerialization(value) {
		if(!(value instanceof Type.Function))
			throw new TypeError('Expected value to be a Function');

		this._afterSerialization = value;

		return this;
	}

	/**
	 * @abstract
	 */
	read() {
		throw new ReferenceError('Method read not defined');
	}

	/**
	 * @abstract
	 */
	write() {
		throw new ReferenceError('Method write not defined');
	}
}

module.exports = Adapter;