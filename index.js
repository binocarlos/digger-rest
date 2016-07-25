var http = require('http')
var level = require('level')
var Router = require('./router')

var args = require('minimist')(process.argv, {
  alias:{
    p:'port',
    f:'file'
  },
  default:{
    port:process.env.PORT || 80,
    file:process.env.FILE || '/tmp/diggerdata'
  }
})

var router = Router(level(args.file))

var httpserver = http.createServer(router)
httpserver.listen(args.port, function(){
  console.log('digger-reset server listening on port ' + args.port)
})