class EJSON {
	constructor(reviver = null, replacer = null, space = 0) {
		if(!(reviver === null || typeof reviver === 'function'))
			throw new TypeError('Expected reviver to be a Function or null');

		if(!(replacer === null || typeof replacer === 'function'))
			throw new TypeError('Expected replacer to be a Function or null');

		if(!(Number.isSafeInteger(space) || typeof space === 'string'))
			throw new TypeError('Expected space to be an Integer or a String');

		this.#replacer = replacer;
		this.#reviver = reviver;
		this.#space = space;
	}

	set reviver(reviver) {
		if(!(reviver === null || typeof reviver === 'function'))
			throw new TypeError('Expected reviver to be a Function or null');

		this.#reviver = reviver;
	}
	set replacer(replacer) {
		if(!(replacer === null || typeof replacer === 'function'))
			throw new TypeError('Expected replacer to be a Function or null');

		this.#replacer = replacer;
	}
	set space(space) {
		if(!(Number.isSafeInteger(space) || typeof space === 'string'))
			throw new TypeError('Expected space to be an Integer or a String');

		this.#space = space;
	}

	get reviver() {
		return this.#reviver;
	}
	get replacer() {
		return this.#replacer;
	}
	get space() {
		return this.#space;
	}

	serialize(data) {
		return JSON.stringify(data, this.#replacer, this.#space);
	}
	deserialize(data) {
		if(!(typeof data === 'string'))
			throw new TypeError('Expected data to be a String');

		return JSON.parse(data, this.#reviver);
	}

	#reviver = null;
	#replacer = null;
	#space = 0;
}

module.exports = EJSON;