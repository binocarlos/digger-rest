var http = require('http')
var tape = require('tape')
var path = require('path')
var async = require('async')
var request = require('request')
var Router = require('./router')

var level    = require('level-test')({mem:true})
var sub = require('level-sublevel')

var db = sub(level('level-digger--append', {encoding: 'json'}))
var server

var testsuite = require('./testsuite')

var VERSION = require(path.join(__dirname, 'package.json')).version

tape('setup server', t => {
  var router = Router(db, '/mydb')
  server = http.createServer(router)
  server.listen(8080, function(){
    t.ok(true, 'server listening')
    t.end()
  })
})

function listkeys(datafn, endfn){

  db.createReadStream()
    .on('data', datafn)
    .on('end', endfn)

}

testsuite(tape, 'http://127.0.0.1:8080', listkeys)


tape('close server', t => {
  server.close()
  t.end()
})