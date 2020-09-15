# DatastoreJS
Simple JSON Datastore for NodeJS

## Features:
- Persistence
    - Load data from Disk / Save data to Disk
    - Automated Loading on Startup
    - Saving at an Interval or with a method call
- Schemas
    - Validate Data against a Schema
- autoWrite
    - Save data at an Interval to Disk
- CRUD (Create, Read, Update, Delete)
    - Create new Documents
    - Query Documents by ID
    - Filter Documents with a Function
    - Update Specific Documents
    - Delete Documents by ID
- Clustering (Planned)
- Replica Sets (Planned)

## ConfigWrapper

Options:
- URI           (required)
- Schema        (required)
- autoLoad      (optional)
- autoWrite     (optional)
- convert       (required w. default)
- persistence   (required w. default)

## Data Manipulation
All Functions work with IDs
- Insert
    - Checks data with Schema
    - Creates Unique ID
    - Inserts Data
    - Returns ID
- Find
    - Works with Boolean Functions
    - Returns ID
- Update
    - Takes ID and Data
    - Checks if ID exists
    - Checks if Data applies to Schema
    - Changes META
    - Returns Updated ID
- Remove
    - Takes ID
    - Deletes DATA at ID
    