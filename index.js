module.exports = {
	Adapter: {
		Adapter: require('./lib/Adapter/Adapter'),
		MemoryAdapter: require('./lib/Adapter/MemoryAdapter'),
		FileAdapter: require('./lib/Adapter/FileAdapter')
	},
	Schema: require('@power-industries/schemajs'),
	Datastore: require('./lib/Datastore')
}