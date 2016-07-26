var http = require('http')
var tape = require('tape')
var path = require('path')
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
    t.equal(res.body[0]._children[0]._digger.path, '/shop/food/folder1', 'the path is set')
    t.equal(res.body[0]._children[0]._digger.inode, 'item1', 'the inode is set')

    t.end()
  })
})

/*
tape('get keys', t => {

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


tape('get one item from the path', t => {
  request({
    url:'http://127.0.0.1:8080/path/shop/food/item1',
    method:'GET',
    json:true
  }, function(err, res){

    if(err){
      t.error(err)
      t.end()
    }

    console.log('-------------------------------------------');
    console.dir(res.statusCode)
    console.dir(res.body)
    t.end()
  })
})*/


tape('close server', t => {
  server.close()
  t.end()
})