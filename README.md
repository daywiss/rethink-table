# Rethink-Table
Useful utility for creating and manipulating [rethinkdb](https://www.rethinkdb.com) tables.
Simple schema definition, and automatic db/table creation. Includes a streaming interface using [highland](https://highlandjs.org).

# Installation
`npm install --save rethink-table`

You must have rethinkdb running which you can connect to.

# Basic Usage
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
  Init.basic(connection,schema).then(function(tables){
    //tables is an object with your schemas table name
    //user table now exists with functions such as
    //get, create, upsert, list, readStream, etc... 

    tables.users...//use the tables api

  })

```

# Advanced Usage
Advanced usage example is included in example-users.js. It shows how to
attach custom methods to your table. Advanced initialization also takes an 
array of table functions.

```js
  var r = require('rethinkdb')
  var {Table,Init,Utils} = require('rethink-table')

  //advanced table requires just a connection
  //the schema is built in. This allows you to attach
  //additional functions to the table specific to your model.
  function AdvancedUserTable(con){
    var schema = {
      table:'users',// Table name
      indices:['email'],// Indices 
      compound:[{ // Compound index
        name:'fullName',fields:['first','last']
      }]
      options:{}  // rethink db table options
    }

    return Table(con,schema).then(function(table){
      //attach additional functions to the model in here
      //see example-user.js

      table.login = function(username,password){
         //...etc
      }
      table.changePassword = function(userid, oldpassword,newpassword){
        //...etc
      }
      return table
    })
  }

  var connection = {
    db:'MyRethinkDB',
  }

  Init.advanced(connection ,AdvancedUserTable).then(function(tables){
    //tables object has a tables.users, the same name as your schema name
  })

```


# API
## Schemas
This library uses a pretty basic schema for defining tables. Define your table name
and any secondary indices.
``` js
  {
    table:'nameOfTable',  //table name
    indices:[ 'secondaryIndexName' ], //any simple secondary indices you want created
    compound:[ {  //any compound secondary indices you want created, see rethinkdb documentation
      name:'compoundName' ,
      fields:['field1','field2']
    }], 
  }
``` 

## Table (con,schema)
The tables class takes a rethink connection and a schema. Returns a promise which
resolves to a table object.
``` js
  var Table = require('rethink-table').Table 

  Table(con,schema).then(function(table){
    //your table object
  })

```
## Table methods
All return promises or in some cases a stream.

### table.get(id)
Get an object from table by id. Promise resolves to object.

### table.getAll(ids)
Get a bunch of objects by array of ids. Promises resolves to an array.

### table.getBy(indexName,id)
Get objects by a secondary id. Promises resolves to an array.

### table.has(id)
Check existence of object by primary id. Promise resolve true or false.

### table.hasBy(indexName,id)
Check existence of object by secondary id. Promise resolves to true or false.

### table.update(id,update)
Update an existing object partially or fully. Object must already exist. Returns a promise which resolves the updated object.

### table.upsert(object)
Update an object if key exists, or insert new object otherwise. Will replace object if one exists.
Object may or may not include id field. If not one will be generated. Returns promise which resolves
to upserted object.

### table.create(object)
Creates an object only if it does not exist. Will throw error if primary id is already in table. Otherwise
will create object id and returns created object.

### table.filter(filterObject)
Filter objects in table by an object using rethink query. Promise resolves to array.

### table.count()
Count number of entries in table. Returns a promise that resolves a number.

### table.readStream()
Stream all rows in table. Returns highland stream which emits each entry in table.

```
  usersTable.readStream().filter(function(user){
    return !user.banned
  }).each(function(unbannedUser){
    //do something
  })
```

### table.run(rethinkQuery)
Runs arbitray rethink query on table.

```
  var r = usersTable.r

  var query = r.table('users').orderBy('created').coerceTo('array')

  table.run(query).then(function(users){
    //sorted users
  })
```



### table.table() or table.query()
Returns the equivalent of r.table('tableName') so that you can write custom queries on table.
You want to pass query to the run function to attach rethink connection if you dont have it.

```

  var query = usersTable.table().orderBy('created').coerceTo('array')

  table.run(query).then(function(users){
    //sorted users
  })
```

### table.streamify(rethinkQuery)
Stream contents of a query which would normally return a cursor. Returns a highland stream.

```
  //query returns cursor
  var query = usersTable.table().filter('validated')

  users.streamify(query).each(function(user){
    //etc
  })
```

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

### table.deleteAll() or table.drop() (deprecated)
Delete all rows in table. Table will still exist.

### table.close()
Close the connection. Will close any other tables sharing the connection object.

## Init
This has some functions for initalizing schemas or advanced tables.

``` js
  var Init = require('rethink-table').Init 

  Init.basic(connectionOptions,schemas).then(function(result){
  })

  Init.advanced(connectionOptions,advancedSchemas).then(function(result){
  })


```

### Init.basic(connectionOptions,basicSchemas)
Schemas can be passed in as a single object for a single schema or an array of schemas. The result
will be an object keyed by the table names of the schemas passed in.

### Init.advanced(connectionOptions,advancedSchemas)
Advanced schemas are functions which take in a connection object and have the schema definition contained.
Function will also take an array of advancedSchemas.

See the example-users.js file for details on the advanced pattern. Returns an object
keyed by the table names given to each schema. 


