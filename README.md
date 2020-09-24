# DatastoreJS
Simple JSON Datastore for NodeJS

## Features:
- Adapters
    - MemoryAdapter, FileAdapter
- Schemas
    - Validate Data against a Schema
- autoLoad
    - Automatically load Data on Startup
- autoWrite
    - Save data at an Interval to Disk
- autoIntegrity
    - Perform an Integrity check on Startup
- Load, Write and Integrity
    - Reload the Datastore at any time
    - Write Datastore to Disk with a Single Method Call
    - Perform an Integrity check of the Data in Memory
- CRUD (Create, Read, Update, Delete)
    - Insert new Records (with optional custom ID)
    - Find Records by ID or Function
    - Update Specific Records by ID or Function
    - Delete Records by ID or Function
- MetaData
    - Every Record saves when it was created and modified (createdAt and modifiedAt)
- Events
    - Define Events for specific Datastore actions
    - Datastore Events (onLoad, onWrite, onAutoWrite, onIntegrity)
    - Record Events (onInsert, onFind, onUpdate, onDelete)
- Datastore Statistics
    - A Method witch returns the recordCount and eventCount