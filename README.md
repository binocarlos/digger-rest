# digger-rest

REST API server for [digger-level](https://github.com/diggerio/digger-level)

## install

Docker container:

```bash
$ docker pull binocarlos/digger-rest
```

Node CLI program:

```bash
$ npm install -g digger-rest
```

Node library:

```bash
$ npm install digger-rest
```

## usage

Docker container:

```bash
$ docker run -d \
  -v /tmp/diggerdata:/data/db \
  -p 8080:80 \
  binocarlos/digger-rest
```

Node CLI program:

```bash
$ digger-rest --port 8080 --file /tmp/diggerdata
```

Node library:

```javascript
var level = require('level')
var sub = require('level-sublevel')
var Router = require('digger-rest')

var leveldb = sub(level('/tmp/digger'))
var router = Router(db)
server = http.createServer(router)
server.listen(8080, function(){
  t.ok(true, 'server listening')
  t.end()
})
```

## routes

#### `GET /version`

get the app version

#### `GET /item/:id`

get an item by it's diggerid

```javascript
request({
  url:'http://127.0.0.1:8080/path/shop/food/folder1/item1',
  method:'GET',
  json:true
}, function(err, res){
  // ...
})
```

results:

```javascript
[
    {
        "name": "Red Apple",
        "_digger": {
            "id": "mything",
            "inode": "item1",
            "class": [
                "apple"
            ],
            "tag": "fruit",
            "diggerid": "0d43987f5d690e10d704583fe30bf75a",
            "path": "/mydb/shop/food/folder1",
            "created": 1469557183129
        },
        "color": "red",
        "_data": {}
    }
]
```

#### `POST /item/:id`

add an item to a diggerid

```javascript
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
  url:'http://127.0.0.1:8080/item/' + FIXEDID,
  method:'POST',
  json:true,
  body:addData
}, function(err, res){
  // ...
})
```

results:

```javascript
[
    {
        "name": "Folder",
        "_digger": {
            "tag": "folder",
            "inode": "addedcities",
            "class": [
                "addcity"
            ],
            "id": "addcity",
            "diggerid": "73d1fab78e5da0bc4c321582fd2d2c2d",
            "path": "/mydb/cities/726acf",
            "created": 1469557266443
        },
        "_data": {}
    }
]
```

#### `PUT /item/:id`

update an item

```javascript
const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'
var updatedata = {
  size:120,
  color:'blue',
  _digger:{
    id:"places2"
  }
}

request({
  url:'http://127.0.0.1:8080/item/' + FIXEDID,
  method:'PUT',
  json:true,
  body:updatedata
}, function(err, res){
  // ...
})
```

this does a deep merge of the data you send

results:

```javascript
[
    {
        "_digger": {
            "tag": "folder",
            "class": [
                "hello"
            ],
            "id": "places2",
            "diggerid": "17dcd3b0ba3411e2b58d91a4d58f5088",
            "inode": "77e8b5",
            "path": "/mydb/cities",
            "created": 1469557371497
        },
        "size": 120,
        "color": "blue",
        "_data": {}
    }
]
```

#### `DELETE /item/:id`

delete an item

```javascript
const FIXEDID = '17dcd3b0ba3411e2b58d91a4d58f5088'
request({
  url:'http://127.0.0.1:8080/item/' + FIXEDID,
  method:'DELETE',
  json:true
}, function(err, res){
  // ...
})
```

#### `GET /path/:path`

get an item at a path

#### `POST /path/:path`

add an item to a path

#### `GET /select/:path?selector=`

select items from a context

if the selector is blank it means `select the item at the path`

otherwise it means `run the selector with the path as the context`

```javascript
request({
  url:'http://127.0.0.1:8080/select/cities',
  method:'GET',
  qs:{
    selector:'country.big city.north > area'
  },
  json:true
}, function(err, res){
  // ...
})
```