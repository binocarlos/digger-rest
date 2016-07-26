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
    name:'Folder',
    _digger:{
      tag:'folder',
      inode:'folder1',
    },
    _children:[{
      name:'Red Apple',
      _digger:{
        id:'mything',
        inode:'item1',
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
    },{
      name:'Apple Sticker2',
      _digger:{
        tag:'sticker'
      },
      title:'Juicy2'
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
    t.equal(res.body[0]._children[0].name, 'Red Apple', 'data is there')
    t.equal(res.body[0]._children[0]._digger.path, '/mydb/shop/food/folder1', 'the path is set')
    t.equal(res.body[0]._children[0]._digger.inode, 'item1', 'the inode is set')

    t.end()
  })
})


tape('list keys', t => {
  
  db.createReadStream()
    .on('data', function (data) {
      console.log(data.key, '=', data.value)
    })
    .on('error', function (err) {
      console.log('Oh my!', err)
    })
    .on('close', function () {
      console.log('Stream closed')
    })
    .on('end', function () {
      console.log('Stream closed')
      t.end()
    })
  
  
})


// load a folder that does not exist in the data
// digger should create folders for virtual entities
tape('get a virtual folder', t => {

  async.series([

    // first the top level folder to ensure the path and inode are correct
    next => {
      request({
        url:'http://127.0.0.1:8080/path/shop',
        method:'GET',
        json:true
      }, function(err, res){

        if(err){
          t.error(err)
          t.end()
        }

        t.equal(res.statusCode, 200, '200 status')
        t.ok(res.body instanceof Array, 'result is an array')

        t.equal(res.body[0]._digger.tag, 'folder', 'tag')
        t.equal(res.body[0]._digger.path, '/mydb', 'path')
        t.equal(res.body[0]._digger.inode, 'shop', 'inode')

        next()
      })
    },

    next => {
      request({
        url:'http://127.0.0.1:8080/path/shop/food',
        method:'GET',
        json:true
      }, function(err, res){

        if(err){
          t.error(err)
          t.end()
        }

        t.equal(res.statusCode, 200, '200 status')
        t.ok(res.body instanceof Array, 'result is an array')

        t.equal(res.body[0]._digger.tag, 'folder', 'tag')
        t.equal(res.body[0]._digger.path, '/mydb/shop', 'path')
        t.equal(res.body[0]._digger.inode, 'food', 'inode')

        next()
      })
    },

    next => {
      request({
        url:'http://127.0.0.1:8080/path/shop/food/folder1/item1',
        method:'GET',
        json:true
      }, function(err, res){

        if(err){
          t.error(err)
          t.end()
        }

        t.equal(res.statusCode, 200, '200 status')
        t.ok(res.body instanceof Array, 'result is an array')

        t.equal(res.body[0]._digger.tag, 'fruit', 'tag')
        t.equal(res.body[0]._digger.path, '/mydb/shop/food/folder1', 'path')
        t.equal(res.body[0]._digger.inode, 'item1', 'inode')

        next()
      })
    }
  ], err => {
    if(err){
      t.error(err)
    }

    t.end()
  })
  
})


tape('close server', t => {
  server.close()
  t.end()
})