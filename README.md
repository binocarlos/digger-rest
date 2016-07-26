# digger-rest

REST API server for [digger-level](https://github.com/diggerio/digger-level)

## install

```bash
$ npm install digger-rest
```

## routes

#### `GET /version`

get the app version

#### `GET /item/:id`

get an item by it's diggerid

#### `POST /item/:id`

add an item to a diggerid

#### `PUT /item/:id`

update an item

#### `DELETE /item/:id`

delete an item

#### `POST /path/:path`

add an item to a path

#### `GET /select/:path?selector=`

select items from a context

if the selector is blank it means `select the item at the path`

otherwise it means `run the selector with the path as the context`
