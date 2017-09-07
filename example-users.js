var Table = require('./table')
var Promise = require('bluebird')
var assert = require('assert')
var lodash = require('lodash')
//Simple example of a user table using rethink-table
//shows how you can attach additional functions specific to your
//table
module.exports = function(con){
  //Schema describes your users table
  var schema = {
    table:'users',//Table name
    indices:['email'],//Indices 
    compound:[{ //Compound index
      name:'fullName',fields:['first','last']
    }]
  }

  //default user data and validation
  function defaultUser(props){
    assert(props.email,'requires email')
    assert(props.first,'requires first name')

    return lodash.defaults(props,{
      role:'user',
      verified:false,
      created:Date.now(),
      last:'',
    })

  }

  return Table(con,schema).then(function(table){

    //we simply attach new functions to the table
    table.createUser = Promise.method(function(email,first,last){
      //emails should be unique, though technically this check
      //will not gaurantee uniqueness without other measures
      return table.hasBy('email',email).then(function(result){
        assert(!result,'Email exists')
        return table.create(defaultUser({email,first,last}))
      })
    })
    
    table.getByEmail = Promise.method(function(email){
      assert(email,'requires email')
      //emails should be unique
      return table.getBy('email',email).then(function(result){
        //should only ever have reuslt length 1
        assert(result,'User not found')
        assert(result.length,'User not found')
        return result[0]
      })                                          
    })

    table.getByFullName = Promise.method(function(first,last){
      assert(first,'requires first name')
      assert(last,'requires last name')
      return table.getBy('fullName',[first,last])
    })

    //return table with additional functions for the user table
    return table
  })
}

