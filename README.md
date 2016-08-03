# shk-madgim-server

## how to use

- install [nodejs]
- clone this repository
- run `node install` while in 'src' directory
- get yourself a [shk-madgim-client]
- run server: `npm start -- --client <client-location> --port <port>` (default port to 8888)

## services

### data

- **initial** `/data/initial/<time>`
get all items existed in the specific time. Result is not limited.

- **range** `/data/range/<from-time>/<to-time>`
get all items generated between `from-time` and `to-time` (inclusive). Result is limited by default to 50 items - a `limit` paramter can be passed in order to increase that limit

all endpoints accept a `format` paramter which can accept either 'json' or 'geojson' value.

### availability

- **query** `/availability/<resolution>/<from-time>/<to-time>
get all the availability records at the requested resolution (usually `<seconds>s` format) optionally starting from the given time to the given end time

### search

- **query** `/search`
search the data for items answering some condition. Currently supported filters:
 - `shape` - an GeoJSON object defining a shapte (type+coordinates) which will be used to filter only items their path intersects this shape

## references

- [naturalearth] has some high resolution vector maps layers
- [tessera] is a node server for serving tiles out of mbtiles file

[//]:#

[shk-madgim-client]: <https://github.com/SBD580/shk-madgim-client>
[nodejs]: <https://nodejs.org/en/download/>
[naturalearth]: <http://www.naturalearthdata.com/downloads/10m-cultural-vectors/>
[tessera]: <https://github.com/mojodna/tessera>
