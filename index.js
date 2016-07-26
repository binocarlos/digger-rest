var http = require('http')
var fs = require('fs')
var level = require('level')
var sub = require('level-sublevel')
var Router = require('./router')

// we do this trick because if they are running on their
// host as non-root we want to default to /tmp
// inside docker however we don't want to tell the user
// to map volumes to /tmp
// the dockerfile creates this file to say 'we are running in docker'
var isDocker = fs.existsSync('/etc/diggerindocker')
var defaultDataPath = isDocker ? '/data/db' : '/tmp/diggerdata'

var args = require('minimist')(process.argv, {
  alias:{
    p:'port',
    f:'file',
    b:'basepath'
  },
  default:{
    port:process.env.PORT || 80,
    file:process.env.FILE || defaultDataPath,
    basepath:process.env.BASEPATH || 'db'
  }
})

var router = Router(sub(level(args.file)), args.basepath)

var httpserver = http.createServer(router)
httpserver.listen(args.port, function(){
  console.log('digger-reset server listening on port ' + args.port)
})