var path = require('path')
var HttpHashRouter = require('http-hash-router')
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