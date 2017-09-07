#Rethink-Table
Useful utility for manipulating [rethinkdb](https://www.rethinkdb.com) tables. Simple schema definition, and automatic
db/table creation. Includes a streaming interface using [highland](https://highlandjs.org).

#Installation
`npm install --save rethink-table`

You must have rethinkdb running which you can connect to.

#Basic Usage
Define your table schema, and connection parameters, pass them into RethinkTable. It will
ensure the database exists, the tables exists and all indices exist then return an object
with your tables attached. 

```js
  var r = require('rethinkdb')
  var tableutils = require('rethink-table').Utils
  var Table = require('rethink-table').Table

  //Schema describes your users table
  var schema = {
    table:'users',//Table name
    indices:['email'],//Indices 
    compound:[{ //Compound index
      name:'fullName',rows:['first','last']
    }]
  }

  var connection = {
    db:'MyRethinkDB',
  }

  r.connect(connection).then(function(con){
    //this will create your database, or do nothing if it already exists
    //it will also assign your connection to use it as the default
    return utils.createDb(con,connection.db)
  }).then(function(con){
    //this creates your rethink table, any indices and makes sure to wait
    //while its building
    return Table(con,schema)
  }).then(function(users){
    //user table now exists with functions such as
    //get, create, upsert, list, readStream, etc... 
    //and all indices
  }}

```

#Advanced Usage
Advanced usage example is included in example-users.js. It shows how to
attach custom methods to your table.


