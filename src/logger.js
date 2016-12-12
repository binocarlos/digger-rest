var pinohttp = require('pino-http')
var pino = require('pino')
var hat = require('hat')

function getLogLevel(level){
  return level || process.env.LOGLEVEL || 'info'
}

function getLogOptions(opts){
  opts = opts || {}
  var level = getLogLevel(opts.level)
  return Object.assign({}, opts, {
    level:level,
    logLevel:level,
    genReqId:function (req) {
      return req.headers['X-TRACER-ID']
    }
  })
}

module.exports = function(opts){
  var httplogger = pinohttp(getLogOptions(opts))
  var logger = pino(getLogOptions(opts))
  return function(req, res){
    var id = req.headers['X-TRACER-ID'] ? req.headers['X-TRACER-ID'] : req.headers['X-TRACER-ID'] = hat()
    httplogger(req, res)
    req.log.debug({}, 'passport request: ' + req.method + ' ' + req.url)
    req.log = logger.child({
      req:{
        id:id,
        method:req.method,
        url:req.url
      }
    })
    req.log.id = id
  }
}