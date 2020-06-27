require('dotenv').config()
var test = require('tape')
var {Table,Init,Utils} = require('./')
// var Table = require('./table')
// var utils = require('./utils')
var Promise = require('bluebird')
var Users = require('./example-users')

var schema = {
  table:'users',
  indices:['email','verified'],
  compound:[{
    name:'fullName',rows:['first','last']
  }],
  // options:{
  //   primaryKey:'id',
  // }
}

var connection = {
  db:'test',
  host:process.env.host,
}

var data = [
  {
    email:'tb@example.com',
    first:'Tim',
    last:'Bo',
    verified:false,
  },
  {
    email:'js@example.com',
    first:'Jon',
    last:'Snow',
    verified:false,
  },
  {
    email:'ab@example.com',
    first:'Anna',
    last:'Banana',
    verified:true,
  },
]

var con = null
var users = null

test('rethink-Table',function(t){
  t.test('init',function(t){
    Utils.connect(connection).then(function(result){
      t.ok(result)
      con = result
      t.end()
    })
  })
  t.test('table init',function(t){
    Table(con,schema).then(function(result){
      t.ok(result)
      users = result
      t.end()
    })
  })
  t.test('delete',function(t){
    users.drop().then(function(result){
      t.ok(result)
      t.end()
    })
  })
  t.test('add data',function(t){
    Promise.map(data,users.upsert).then(function(result){
      t.equal(result.length,data.length)
      t.end()
    })
  })
  t.test('stream results',function(t){
    users.readStream().toArray(function(result){
      t.equal(result.length,data.length)
      t.end()
    })
  })
  t.test('getBy',function(t){
    users.getBy('fullName',['Jon','Snow']).then(function(result){
      t.equal(result.length,1)
      t.equal(result[0].email,data[1].email)
      t.end()
    })
  })
  t.test('getBy',function(t){
    users.getBy('email','tb@example.com').then(function(result){
      t.equal(result.length,1)
      t.equal(result[0].first,data[0].first)
      t.end()
    })
  })
  t.test('getBy',function(t){
    users.getBy('verified',false).then(function(result){
      t.equal(result.length,2)
      t.end()
    })
  })

  t.test('has By',function(t){
    t.plan(2)
    users.hasBy('fullName',['Anna','Banana']).then(function(result){
      t.ok(result)
    })
    users.hasBy('fullName',['Anna','Pineapple']).then(function(result){
      t.notOk(result)
    })
  })

  t.test('filter',function(t){
    users.filter({last:'Snow'}).then(function(result){
      t.equal(result.length,1)
      t.equal(result[0].email,data[1].email)
      t.end()
    })
  })

  t.test('count',function(t){
    users.count().then(function(result){
      t.equal(result,data.length)
      t.end()
    })
  })

  t.test('disconnect',function(t){
    users.close().then(function(){
      t.end()
    })
  })
})

test('example user',function(t){
  t.test('init',function(t){
    Utils.connect(connection).then(function(result){
      t.ok(result)
      con = result
      t.end()
    })
  })
  t.test('init users',function(t){
    Users(con).then(function(result){
      t.ok(result)
      users = result
      t.end()
    })
  })
  t.test('delete',function(t){
    users.drop().then(function(result){
      t.ok(result)
      t.end()
    })
  })
  t.test('create user',function(t){
    var {email,first,last} = data[0]
    users.createUser(email,first,last).then(function(result){
      t.ok(result)
      t.end()
    })
  })
  t.test('getuserbyemail',function(t){
    users.getByEmail(data[0].email).then(function(result){
      t.equal(result.email,data[0].email)
      t.end()
    })
  })
  t.test('disconnect',function(t){
    users.close().then(function(){
      t.end()
    })
  })
})

test('init',function(t){
  t.test('basic',function(t){
    return Init.basic(connection,schema).then(function(result){
      t.ok(result.users)
      return result.users.close()
    }).then(function(){
      t.end()
    })
  })
  t.test('Advanced',function(t){
    return Init.advanced(connection,Users).then(function(result){
      t.ok(result.users)
      return result.users.close()
    }).then(function(){
      t.end()
    })
  })
})
