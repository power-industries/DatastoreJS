# DatastoreJS
Simple JSON Datastore

## Features:

### Adapters

DatastoreJS features 2 built-in Adapters: MemoryAdapter and FileAdapter. Both extend the abstract Adapter Class.
Custom Adapters can be written and used by extending the abstract Adapter Class.

- MemoryAdapter loads and writes data from/to RAM, i.e. a Variable. All Data is lost when the process gets stopped.
- FileAdapter loads and writes data from/to Disk, i.e. a File.

### Schemas

DatastoreJS uses SchemaJS to provide powerful Schema Validation and Parsing. Schemas can even be used for querying.

### autoLoad/autoWrite

DatastoreJS supports automatic loading on startup. This allows for direct usage without having to call .load() manually.
DatastoreJS also supports automatic writing in Intervals. This is great for continuous persistence without writing 
  after every change.

### autoIntegrity

DatastoreJS can perform Integrity checks on load (including autoLoad). Integrity checks are Schema Validations performed 
  on every Record in the Datastore.

### Manual load/write/integrityCheck

DatastoreJS allows for manual load, write and integrityCheck calls.

### Events

DatastoreJS supports function execution (as Events) on the following occasions:
  - onLoad
  - onWrite
  - onAutoWrite
  - onIntegrity
  - onInsert
  - onFind
  - onUpdate
  - onDelete

### MetaData

DatastoreJS automatically saves the following MetaData inside every record
  - _id
  - _createdAt
  - _modifiedAt

as well as the following MetaData inside the Datastore
  - _recordCount
  - _eventCount

### CRUD

DatastoreJS supports the following CRUD operations:

insertOne
insertMany
find
findByID
findBySchema

filter
filterByID
filterBySchema

update
updateByID
updateBySchema

delete
deleteByID
deleteBySchema