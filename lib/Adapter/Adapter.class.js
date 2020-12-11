class Adapter {
	/**
	 * @param data {String}
	 * @abstract
	 */
	init(data) {
		throw new ReferenceError('Method init not implemented');
	}

	/**
	 * @returns {String}
	 * @abstract
	 */
	read() {
		throw new ReferenceError('Method read not implemented');
	}

	/**
	 * @param data {String}
	 * @abstract
	 */
	write(data) {
		throw new ReferenceError('Method write not implemented');
	}
}

module.exports = Adapter;