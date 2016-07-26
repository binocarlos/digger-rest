var path = require('path')
var HttpHashRouter = require('http-hash-router')
var concat = require('concat-stream')
var digger = require('./digger')


var VERSION = require(path.join(__dirname, 'package.json')).version

module.exports = function(leveldb){

  var client = digger(leveldb)
  var router = HttpHashRouter()

  router.set('/version', {
    GET:function(req, res){
      res.end(VERSION)
    }
  })

  router.set('/path/*', {
    GET:function(req, res, opts, onError){
      var path = opts.splat
      path = path.indexOf('/') == 0 ? path : '/' + path
      var parts = path.split('/')
      var inode = parts.pop()
      path = parts.join('/')

      const warehouse = client.connect(path)

      warehouse('fruit > sticker')
        .ship(function(results){
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(results.toJSON()))
        })
        .on('error', function(err){
          res.statusCode = 500
          res.end(err.toString())
        })
    },
    POST:function(req, res, opts, onError){

      // the warehouse path set from the url
      // this is the container we are appending to
      var path = opts.splat
      path = path.indexOf('/') == 0 ? path : '/' + path
      const warehouse = client.connect(path)

      req.pipe(concat(function(body){
        try {
          body = JSON.parse(body.toString())
        } catch (e) {
          res.statusCode = 500
          return res.end(e.toString())
        }

        const addContainer = client.create(body)

        warehouse
          .append(addContainer)
          .ship(function(added){
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(added.toJSON()))
          })
          .on('error', function(err){
            res.statusCode = 500
            res.end(err.toString())
          })

      }))

    }
  })

  function handler(req, res) {

    function onError(err) {
      if (err) {
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
      }
    }

    router(req, res, {}, onError) 
  }

  return handler
}