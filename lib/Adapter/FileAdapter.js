const Type = require('@power-industries/typejs');
const fs = require('fs');
const Adapter = require('./Adapter');

class FileAdapter extends Adapter {
	constructor(filename) {
		super();

		if(!(filename instanceof Type.String))
			throw new TypeError('Expected filename to be a String');

		this._filename = filename;
	}

	read() {
		return fs.readFileSync(this._filename, 'utf8');
	}
	write(data) {
		fs.writeFileSync(this._filename, data, 'utf8');
	}
}

module.exports = FileAdapter;