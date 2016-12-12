var http = require('http')
var path = require('path')
var async = require('async')
var request = require('request')

var VERSION = require(path.join(__dirname, '..', 'package.json')).version

module.exports = function(tape, url){
  tape('read version', t => {
    request({
      url: url + '/version',
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
      url: url + '/path/shop/food',
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


  tape('append city data to a path', t => {

    const citydata = require('./cities.json')

    request({
      url: url + '/path/cities',
      method:'POST',
      json:true,
      body:citydata
    }, function(err, res){

      if(err){
        t.error(err)
        t.end()
      }

      t.equal(res.statusCode, 200, '200 status')

      t.end()
    })
  })


  tape('list keys', t => {
    
    request({
      url: url + '/keys',
      method:'GET',
      json:true
    }, function(err, res){

      if(err){
        t.error(err)
        t.end()
      }

      console.log(res.body.join("\n"))

      t.end()
    })

  })
  

  // load a folder that does not exist in the data
  // digger should create folders for virtual entities
  tape('get items from paths', t => {

    async.series([

      // first the top level folder to ensure the path and inode are correct
      next => {
        request({
          url: url + '/path/shop',
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
          url: url + '/path/shop/food',
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
          url: url + '/path/shop/food/folder1/item1',
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


  tape('run a classname selector', t => {

    request({
      url: url + '/select/cities',
      method:'GET',
      qs:{
        selector:'.south'
      },
      json:true
    }, function(err, res){

      if(err){
        t.error(err)
        t.end()
      }

      t.equal(res.statusCode, 200, '200 status')
      t.ok(res.body instanceof Array, 'result is an array')
      t.equal(res.body.length, 3, '3 results')
      t.equal(res.body[0]._digger.tag, 'city', 'city results')

      t.end()
    })
  })

  // load an item we know was added from cities.json
  tape('GET diggerid', t => {

    const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'

    request({
      url: url + '/item/' + FIXEDID,
      method:'GET',
      json:true
    }, function(err, res){

      if(err){
        t.error(err)
        t.end()
      }

      t.equal(res.statusCode, 200, '200 status')
      t.ok(res.body instanceof Array, 'result is an array')
      t.equal(res.body[0]._digger.diggerid, FIXEDID, 'diggerid')

      t.end()
    })
  })

  // append an item to the known cities folder and select it

  tape('POST diggerid', t => {

    const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'
    const addData = {
      name:'Folder',
      _digger:{
        tag:'folder',
        inode:'addedcities',
        class:['addcity'],
        id:'addcity'
      }
    }

    request({
      url: url + '/item/' + FIXEDID,
      method:'POST',
      json:true,
      body:addData
    }, function(err, res){

      if(err){
        t.error(err)
        t.end()
      }

      t.equal(res.statusCode, 200, '200 status')
      t.equal(res.body[0]._digger.inode, 'addedcities', 'added inode')

      request({
        url: url + '/select/cities',
        method:'GET',
        qs:{
          selector:'folder.hello > folder.addcity'
        },
        json:true
      }, function(err, res){

        if(err){
          t.error(err)
          t.end()
        }

        t.equal(res.statusCode, 200, '200 status')
        t.equal(res.body[0]._digger.inode, 'addedcities', 'added inode')

        
        
        t.end()
      })
      
    })
  })

  tape('PUT diggerid', t => {

    const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'
    var updatedata = {
      size:120,
      color:'blue'
    }

    async.series([

      next => {

        request({
          url: url + '/item/' + FIXEDID,
          method:'PUT',
          json:true,
          body:updatedata
        }, function(err, res){

          if(err) return next(err)

          t.equal(res.statusCode, 200, '200 status')
          t.equal(res.body[0].size, 120, 'value added')

          next()
        })

      },


      next => {
        request({
          url: url + '/item/' + FIXEDID,
          method:'GET',
          json:true
        }, function(err, res){

          if(err) return next(err)
          
          t.equal(res.statusCode, 200, '200 status')
          t.equal(res.body[0].size, 120, 'value added')
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


  tape('DELETE diggerid', t => {

    const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'
    
    async.series([

      next => {
        request({
          url: url + '/item/' + FIXEDID,
          method:'GET',
          json:true
        }, function(err, res){

          if(err) return next(err)

          t.equal(res.statusCode, 200, '200 status')
          t.equal(res.body.length, 1, '1 result')
          
          next()
        })
      },

      next => {

        request({
          url: url + '/item/' + FIXEDID,
          method:'DELETE',
          json:true
        }, function(err, res){

          if(err) return next(err)
          t.equal(res.statusCode, 200, '200 status')

          next()
        })

      },


      next => {
        request({
          url: url + '/item/' + FIXEDID,
          method:'GET',
          json:true
        }, function(err, res){

          if(err) return next(err)
          
          t.equal(res.statusCode, 200, '200 status')
          t.equal(res.body.length, 0, '0 results')
          next()
        })
      },

      next => {

        var counter = 0


        request({
          url: url + '/keys',
          method:'GET',
          json:true
        }, function(err, res){

          if(err) return next(err)

          var cityItems = res.body.filter(function(key){
            return key.indexOf('/mydb/cities')==0
          })

          console.log(res.body.join("\n"))

          t.equal(cityItems.length, 1, 'only one entry for /mydb/cities')

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
}