var lodash = require('lodash')
var assert = require('assert')
var Promise = require('bluebird')

var r = require('rethinkdb')
var Table = require('./table')
var utils = require('./utils')

function basic(options,schemas){
  schemas = lodash.castArray(schemas)
  return r.connect(options).then(function(con){
    return utils.createDB(con,options.db)
  }).then(function(con){
    return Promise.reduce(schemas,function(result,schema){
      return Table(con,schema).then(function(table){
        result[schema.table] = table
        return result
      })
    },{_con:con,_options:options})
  })
}

function advanced(options,tables){
  tables = lodash.castArray(tables)
  return r.connect(options).then(function(con){
    return utils.createDB(con,options.db)
  }).then(function(con){
    return Promise.reduce(tables,function(result,table){
      return table(con).then(function(table){
        result[table.schema.table] = table
        return result
      })
    },{_con:con,_options:options})
  })
}

module.exports = {
  advanced,basic
}



