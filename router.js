const path = require('path')
const url = require('url')
const HttpHashRouter = require('http-hash-router')
const concat = require('concat-stream')
const digger = require('./digger')

// if the basepath is not passed we do need one
// to make the path based queries work
const DEFAULT_BASE_PATH = '/mydb'
const VERSION = require(path.join(__dirname, 'package.json')).version

// get warehousepath and itempath from opts.params.warehouse and opts.splat
function getWarehousePaths(opts, basepath){
  var itempath = opts.splat || ''
  itempath = itempath.indexOf('/') == 0 ? itempath : '/' + itempath

  return {
    warehouse:basepath,
    item:itempath
  }
}

module.exports = function(leveldb, basepath){

  basepath = basepath || DEFAULT_BASE_PATH

  var client = digger(leveldb)
  var router = HttpHashRouter()

  router.set('/version', {
    GET:function(req, res){
      res.end(VERSION)
    }
  })

  function getItemById(req, res, opts, onError){
    const id = opts.params.id
    const warehouse = client.connect(basepath)

    const selector = '=' + id

    warehouse(selector)
      .ship(function(results){
        res.end(JSON.stringify(results.toJSON()))
      })
      .on('error', function(err){
        res.statusCode = 500
        res.end(err.toString())
      })
  }

  function postItemById(req, res, opts, onError){
    const id = opts.params.id
    const warehouse = client.connect(basepath)

    req.pipe(concat(function(body){
      try {
        body = JSON.parse(body.toString())
      } catch (e) {
        res.statusCode = 500
        return res.end(e.toString())
      }

      const addContainer = client.create(body)

      warehouse('=' + id)
        .ship(function(results){

          if(results.count()<=0){
            res.statusCode = 404
            res.end(id + ' not found')
            return
          }

          results
            .append(addContainer)
            .ship(function(added){
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(added.toJSON()))
            })
            .on('error', function(err){
              res.statusCode = 500
              res.end(err.toString())
            })

        })
        .on('error', function(err){
          res.statusCode = 500
          res.end(err.toString())
        })
    }))
  }

  function putItemById(req, res, opts, onError){
    const id = opts.params.id
    const warehouse = client.connect(basepath)

    req.pipe(concat(function(body){
      try {
        body = JSON.parse(body.toString())
      } catch (e) {
        res.statusCode = 500
        return res.end(e.toString())
      }

      warehouse('=' + id)
        .ship(function(results){

          if(results.count()<=0){
            res.statusCode = 404
            res.end(id + ' not found')
            return
          }

          Object.keys(body || {}).forEach(function(key){
            results.attr(key, body[key])
          })

          results
            .save()
            .ship(function(added){
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(added.toJSON()))
            })
            .on('error', function(err){
              res.statusCode = 500
              res.end(err.toString())
            })

        })
        .on('error', function(err){
          res.statusCode = 500
          res.end(err.toString())
        })
    }))
  }

  // get a single item by it's path
  function getItemByPath(req, res, opts, onError){

    const paths = getWarehousePaths(opts, basepath)
    const warehouse = client.connect(paths.warehouse)

    warehouse(paths.item)
      .ship(function(results){
        res.setHeader('content-type', 'application/json')

        if(results.count()>0){
          var parts = results.digger('path').split('/')
          if(parts[parts.length-1]==results.digger('inode')){
            parts.pop()
            results.digger('path', parts.join('/'))
          }
        }
        
        res.end(JSON.stringify(results.toJSON()))
      })
      .on('error', function(err){
        res.statusCode = 500
        res.end(err.toString())
      })
  }

  // append items to a path
  function postItemByPath(req, res, opts, onError){

    const paths = getWarehousePaths(opts, basepath)
    const itempath = paths.warehouse + paths.item
    const warehouse = client.connect(itempath)

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

  // run a selector on a context
  function selectItemsByPath(req, res, opts, onError){
    const paths = getWarehousePaths(opts, basepath)
    const itempath = paths.warehouse + paths.item
    const warehouse = client.connect(itempath)

    const selector = url.parse(req.url, true).query.selector
    res.setHeader('content-type', 'application/json')

    warehouse(selector)
      .ship(function(results){
        res.end(JSON.stringify(results.toJSON()))
      })
      .on('error', function(err){
        res.statusCode = 500
        res.end(err.toString())
      })
  }

  router.set('/path/*', {
    GET:getItemByPath,
    POST:postItemByPath
  })

  router.set('/select/*', {
    GET:selectItemsByPath
  })

  router.set('/item/:id', {
    GET:getItemById,
    POST:postItemById,
    PUT:putItemById
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