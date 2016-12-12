const path = require('path')
const url = require('url')
const HttpHashRouter = require('http-hash-router')
const concat = require('concat-stream')
const DeepMerge = require("deep-merge/multiple")
const digger = require('./digger')
const Logger = require('./logger')
const VERSION = require(path.join(__dirname, '..', 'package.json')).version

const merge = DeepMerge(function(a, b){
  return b
})
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

  if(!basepath){
    throw new Error('basepath required')
  }

  if(basepath.indexOf('/')!=0){
    throw new Error('basepath must start with /')
  }

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

          var diggerData = body._digger || {}

          // remove path based digger fields
          delete(diggerData.inode)
          delete(diggerData.diggerid)
          delete(diggerData.path)
          delete(diggerData.created)
      
          results.models[0] = merge([results.models[0], body])

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

  function deleteItemById(req, res, opts, onError){
    const id = opts.params.id
    const warehouse = client.connect(basepath)

    warehouse('=' + id)
      .ship(function(results){

        if(results.count()<=0){
          res.statusCode = 404
          res.end(id + ' not found')
          return
        }

        results
          .remove()
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
        // filter out the node with the path because we are doing
        // a selector 'inside' it
        results = results.toJSON().filter(function(result){
          return [result._digger.path, result._digger.inode].join('/') != itempath
        })
        res.end(JSON.stringify(results))
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
    PUT:putItemById,
    DELETE:deleteItemById
  })

  router.set('/keys', {
    GET:function(req, res, opts, onError){
      var arr = []
      leveldb.createReadStream()
        .on('data', function(d){
          arr.push(d.key)
        })
        .on('end', function(err){
          if(err){
            res.statusCode = 500
            res.end(err.toString())
            return
          }
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(arr))
        })
    }
  })

  var logger = Logger({
    name:'digger-rest'
  })

  function handler(req, res) {

    logger(req, res)

    function onError(err) {
      if (err) {
        req.log.error(err)
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
      }
    }

    router(req, res, {}, onError)
  }

  return handler
}