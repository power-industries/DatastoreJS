const Datastore = require('./lib/Datastore.class');
const Adapter = require('./lib/Adapter/Adapter.class');
const MemoryAdapter = require('./lib/Adapter/Adapter.class');
const FileAdapter = require('./lib/Adapter/Adapter.class');

module.exports = {
	DataStore: Datastore,
	Adapter: {
		Adapter: Adapter,
		Memory: MemoryAdapter,
		File: FileAdapter
	}
};