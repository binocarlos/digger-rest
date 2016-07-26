var http = require('http')
var tape = require('tape')
var path = require('path')
var request = require('request')
var Router = require('./router')

var level    = require('level-test')()
var sub = require('level-sublevel')

var db = sub(level('level-digger--append', {encoding: 'json'}))
var server

var VERSION = require(path.join(__dirname, 'package.json')).version

tape('setup server', t => {
  var router = Router(db)
  server = http.createServer(router)
  server.listen(8080, function(){
    t.ok(true, 'server listening')
    t.end()
  })
})

tape('read version', t => {
  request({
    url:'http://127.0.0.1:8080/version',
    method:'GET'
  }, function(err, res){

    if(err){
      t.error(err)
      t.end()
    }

    t.equal(res.statusCode, 200, '200 status')
    t.equal(res.body, VERSION, 'version match')
    t.end()
  })
  
})

tape('append data to a path', t => {
  const addData = {
    name:'Red Apple',
    _digger:{
      id:'mything',
      class:['apple'],
      tag:'fruit'
    },
    color:'red',
    _children:[{
      name:'Apple Sticker',
      _digger:{
        tag:'sticker'
      },
      title:'Juicy'
    }]
  }

  request({
    url:'http://127.0.0.1:8080/path/shop/food',
    method:'POST',
    json:true,
    body:addData
  }, function(err, res){

    if(err){
      t.error(err)
      t.end()
    }

    t.equal(res.statusCode, 200, '200 status')
    t.equal(res.body[0].name, 'Red Apple', 'data is there')
    t.equal(res.body[0]._digger.path, '/shop/food', 'the path is set')

    t.end()
  })
})

tape('close server', t => {
  server.close()
  t.end()
})