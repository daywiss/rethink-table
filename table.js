const Promise = require('bluebird')
const lodash = require('lodash')
const assert = require('assert')
const utils = require('./utils')
var r = require('rethinkdb')
var highland = require('highland')


module.exports = function(con,schema){
  assert(con,'Table requires rethink db connection')
  assert(schema,'Table requires schema object')
  var methods = {}
  
  methods.schema = schema
  methods.con = con

  function mapResult(data,result){
    if(result == null) return data
    if(result.changes == null) return data
    if(result.changes[0] == null) return data
    return result.changes[0].new_val
  }

  methods.get = Promise.method(function(id){
    assert(id != null,'requires id to get')
    return r.table(schema.table)
      .get(id)
      .run(con)
      .then(function(result){
        assert(result,'Does not exist in ' + schema.table)
        return result
      })
  })

  //get array of ids
  methods.getAll = Promise.method(function(ids){
    if(lodash.isEmpty(ids)) return []
    ids = lodash.castArray(ids)
    return r.table(schema.table)
      .getAll(r.args(ids))
      .coerceTo('array')
      .run(con)
  })

  methods.getBy = Promise.method(function(index,id){
    assert(id != null,'requires id to get by')
    assert(index != null,'requires index to get by')
    return r.table(schema.table)
      .getAll(id,{index:index})
      .coerceTo('array')
      .run(con)
  })

  //runs a query with the connection
  methods.run = function(query){
    return query.run(con)
  }

  methods.streamify = function(query){
    return highland(function(push,next){
      query.run(con).then(function(cursor){
        cursor.each(push,function(){
          push(null,highland.nil)
        })
      })
    })
  }

  methods.readStream = function(){
    return methods.streamify(r.table(schema.table))
  }

  //create new id for document, or insert existing id
  //replace entire doc on conflict and return document
  methods.upsert = Promise.method(function(data){
    assert(data != null,'requires object to upsert')
    return r.table(schema.table)
      .insert(data,{returnChanges:true,conflict:'replace'})
      .run(con)
      .then(function(result){
        return mapResult(data,result)
      })
  })

  //create new id for document, error if conflict
  methods.create = Promise.method(function(data){
    assert(data != null,'requires object to create')
    return r.table(schema.table)
      .insert(data,{returnChanges:true,conflict:'error'})
      .run(con)
      .then(function(result){
        return mapResult(data,result)
      })
  })

  methods.count = function(){
    return r.table(schema.table).count().run(con)
  }
  
  //update fields in existing document
  methods.update = Promise.method(function(id,data){
    assert(id != null,'requires id of object to update')
    assert(data != null,'requires object to update')
    return r.table(schema.table)
      .get(id)
      .update(data,{returnChanges:true})
      .run(con)
      .then(function(result){
        return mapResult(data,result)
      })
  })

  methods.has = Promise.method(function(id){
    assert(id != null,'requires id to check existence of')
    return methods.get(id).then(function(result){
      return result != null
    }).catch(function(err){
      return false
    })
  })

  methods.hasBy = Promise.method(function(index,id){
    assert(id != null,'requires id to check existence of')
    assert(index != null,'requires index to check existence of')
    return methods.getBy(index,id).then(function(result){
      if(result == null) return false
      return result.length > 0
    })
  })

  methods.filter = function(props){
    return r.table(schema.table).filter(props).coerceTo('array').run(con)
  }


  methods.table = function(){
    return r.table(schema.table)
  }

  methods.list = function(){
    return r.table(schema.table).coerceTo('array').run(con)
  }

  methods.delete = Promise.method(function(id){
    assert(id != null,'requires id to delete')
    return r.table(schema.table)
      .get(id)
      .delete()
      .run(con)
  })

  //static rethink object
  methods.r = r
  
  //drop table
  methods.drop = function(){
    return r.table(schema.table).delete().run(con)
  }                    

  //close connection
  methods.close = function(){
    return con.close()
  }
  return utils.initTable(con,schema).then(function(){
    return methods
  })
    
}
