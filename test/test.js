var http = require('http')
var tape = require('tape')
var path = require('path')
var async = require('async')
var request = require('request')
var Router = require('../src/router')

var level    = require('level-test')({mem:true})
var sub = require('level-sublevel')

var db
var server

var testsuite = require('./testsuite')

var VERSION = require(path.join(__dirname, '..', 'package.json')).version

var args = require('minimist')(process.argv, {
  alias:{
    s:'server'
  }
})

if(!args.server){

  db = sub(level('level-digger--append', {encoding: 'json'}))

  tape('setup server', t => {
    var router = Router(db, '/mydb')
    server = http.createServer(router)
    server.listen(8080, function(){
      t.ok(true, 'server listening')
      t.end()
    })
  })
}

var serverAddress = args.server ? args.server : 'http://127.0.0.1:8080'

testsuite(tape, serverAddress)

if(!args.server){
  tape('close server', t => {
    server.close()
    t.end()
  })
}