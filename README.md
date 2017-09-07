#Rethink-Table
Useful utility for creating and manipulating [rethinkdb](https://www.rethinkdb.com) tables.
Simple schema definition, and automatic db/table creation. Includes a streaming interface using [highland](https://highlandjs.org).

#Installation
`npm install --save rethink-table`

You must have rethinkdb running which you can connect to.

#Basic Usage
Define your table schema, and connection parameters, pass them into RethinkTable. It will
ensure the database exists, the tables exists and all indices exist then return an object
with your tables attached. 

```js
  var r = require('rethinkdb')
  var {Table,Init,Utils} = require('rethink-table')

  //Schema describes your users table
  var schema = {
    table:'users',//Table name
    indices:['email'],//Indices 
    compound:[{ //Compound index
      name:'fullName',fields:['first','last']
    }]
  }

  var connection = {
    db:'MyRethinkDB',
  }

  //Basic init creates database, and will create tables, indices for your schema.
  Init.Basic(connection,schema).then(function(tables){
    //tables is an object with your schemas table name
    //user table now exists with functions such as
    //get, create, upsert, list, readStream, etc... 

    tables.users...//use the tables api

  })

```

#Advanced Usage
Advanced usage example is included in example-users.js. It shows how to
attach custom methods to your table. You can usee kkk

```js
  var r = require('rethinkdb')
  var {Table,Init,Utils} = require('rethink-table')

  //advanced table requires just a connection
  //the schema is built in. This allows you to attach
  //additional functions to the table specific to your model.
  function AdvancedUserTable(con){
    var schema = {
      table:'users',//Table name
      indices:['email'],//Indices 
      compound:[{ //Compound index
        name:'fullName',fields:['first','last']
      }]
    }

    return Table(con,schema).then(function(table){
      //attach additional functions to the model in here
      //see example-user.js

      table.login ...etc
      table.changePassword ...etc

      return model
    })
  }

  var connection = {
    db:'MyRethinkDB',
  }

  Init.Advanced(connection ,AdvancedUserTable).then(function(tables){
    //tables object has a tables.users, the same name as your schema name
  })

```


#API
##Schemas
This library uses a pretty basic schema for defining tables. Define your table name
and any secondary indices.
``` js
  {
    table:'nameOfTable',  //table name
    indices:[ 'secondaryIndexName' ], //any simple secondary indices you want created
    compound:[ 
      name:'compoundName' 
      fields:['field1',field2'],
    ], //any compound secondary indices you want created, see rethinkdb documentation
  }
``` 

##Table (con,schema)
The tables class takes a rethink connection and a schema. Returns a promise which
resolves to a table object.
``` js
  var Table = require('rethink-table').Table 

  Table(con,schema).then(function(table){
    //your table object
  })

```
##Table methods
All return promises or in some cases a stream.

### table.get(id)
Get an object from table by id

### table.getAll(ids)
Get a bunch of objects by array of ids. Promises resolves to an array.

### table.getBy(indexName,id)
Get objects by a secondary id. Promises resolves to an array.

### table.has(id)

Check existence of object by primary id.
### table.hasBy(indexName,id)
Check existence of object by secondary id. Promise resolves to an array.

### table.filter(filterObject)
Filter objects in table by an object

### table.count()
Count number of entries in table.
### table.readStream()
Stream all rows in table. Returns highland stream.

### table.streamify(rethinkQuery)
Stream contents of a query which would normally return a cursor. Returns a rethink stream.

### table.table()
Returns the equivalent of r.table('tableName') so that you can write custom queries on table.

### table.run(rethinkQuery)
Runs arbitray rethink  uery on table.

### table.list()
Returns array of all rows in table. Promise resolves to an array.

### table.schema
The schema that defined this table.

### table.con
The current connection object.

### table.r
The static object which represents the rethink library, r = require('rethinkdb')

### table.delete(id)
Delete an item by primary id.

### table.drop()
Delete the entire table.

### table.close()
Close the connection. Will close any other tables sharing the connection object.

##Init
This has some functions for initalizing schemas or advanced tables.

``` js
  var Init = require('rethink-table').Init 

  Init.Basic(connectionOptions,schemas).then(function(result){
  })

  Init.Advanced(connectionOptions,advancedSchemas).then(function(result){
  })


```

###Basic(connectionOptions,basicSchemas)
Schemas can be passed in as a single object for a single schema or an array of schemas. The result
will be an object keyed by the table names of the schemas passed in.

###Advanced(connectionOptions,advancedSchemas)
Advanced schemas are functions which take in a connection object and have the schema definition contained.
See the example-users.js file for details on the advanced pattern. Returns an object
keyed by the table names given to each schema. 


