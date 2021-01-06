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

	static get defaultReviver() {
		return function(key, value) {
			if(Object.prototype.toString.call(value) === '[object Object]') {
				if (value.type === 'Map')
					return new Map(value.value);

				if(value.type === 'Set')
					return new Set(value.value);
			}

			return value;
		}
	}
	static get defaultReplacer() {
		return function(key, value) {
			if (this[key] instanceof Map)
				return {
					type: 'Map',
					value: Array.from(this[key].entries())
				};
			else if(this[key] instanceof Set)
				return {
					type: 'Set',
					value: Array.from(this[key].values())
				};
			else
				return value;
		}
	}

	#reviver = null;
	#replacer = null;
	#space = 0;
}

module.exports = EJSON;