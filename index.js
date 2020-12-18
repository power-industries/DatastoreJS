const Datastore = require('./lib/Datastore.class');
const Adapter = require('./lib/Adapter/Adapter.class');
const MemoryAdapter = require('./lib/Adapter/Memory.Adapter.class');
const FileAdapter = require('./lib/Adapter/File.Adapter.class');
const Config = require('./lib/Util/Config.class');
const Schema = require('@power-industries/schemajs');

module.exports = {
	DataStore: Datastore,
	Schema: Schema,
	Util: {
		Adapter: Adapter,
		MemoryAdapter: MemoryAdapter,
		FileAdapter: FileAdapter,
		Config: Config
	}
};