var diggerlevel = require('digger-level')
var diggerserver = require('digger-server')
var diggerclient = require('digger-client')

module.exports = function(leveldb){

  var supplier = diggerlevel(leveldb)

  var digger = diggerserver()
  digger.warehouse(supplier)

  var client = diggerclient();
  client.on('request', function(req, res){
    digger.reception(res, res)
  })

  return client
}