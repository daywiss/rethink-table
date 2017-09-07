const Promise = require('bluebird')
const assert = require('assert')
const lodash = require('lodash')
var r = require('rethinkdb')

exports.createIndex = Promise.method(function(con,table,index){
  assert(con,'requires rethink connection')
  if(table == null) return con
  if(index == null) return con
  return r.table(table).indexCreate(index).run(con).then(function(){
    return r.table(table).indexWait(index).run(con)
  }).then(function(){
    console.log('secondary index',index,'created')
    return con
  }).catch(function(err){
    console.log('secondary index',index,'already exists')
  })
})

//compound index expects this pattern:
//  {
//    name:'name of index',
//    rows:['field1','field2']
//  }
exports.createCompound = Promise.method(function(con,table,index,rows){
  assert(con,'requires rethink connection')
  if(con == null) return con
  if(table == null) return con
  if(index == null) return con
  rows = lodash.map(rows,function(row){
    return r.row(row)
  })
  
  return r.table(table).indexCreate(index,rows).run(con).then(function(){
    return r.table(table).indexWait(index).run(con)
  }).then(function(){
    console.log('compound index',index,'created')
    return con
  }).catch(function(err){
    console.log('compound index',index,'already exists')
    return con
  })
})


exports.initTable = Promise.method(function(con,schema){
  assert(con,'requires rethink connection')
  assert(schema,'table initialization requires schema with table name')
  assert(schema.table,'table initialization requires schema with table name')
  return r.tableCreate(schema.table).run(con).then(function(){
    console.log('table',schema.table,'created')
    return true
  }).catch(function(err){
    console.log('table',schema.table,'already exists')
    return true
  }).then(function(){
    if(schema.indices == null) return 
    return Promise.map(schema.indices,function(index){
      return exports.createIndex(con,schema.table,index)
    })
  }).then(function(){
    if(schema.compound == null) return 
    return Promise.map(schema.compound,function(index){
      return exports.createCompound(con, schema.table,index.name,index.rows || index.fields || index.indicies)
    })
  })
})

exports.createDB = Promise.method(function(con,db){
  assert(con,'requires rethink connection')
  if(db == null) return con
  return r.dbCreate(db).run(con).then(function(){
    console.log('db ' + db + ' created')
    con.use(db)
    return con
  }).catch(function(err){
    console.log('db ' + db + ' exists')
    con.use(db)
    return con
  })
})

exports.connect = function(options){
  return r.connect(options).then(function(con){
    return exports.createDB(con,options.db)
  })
}


