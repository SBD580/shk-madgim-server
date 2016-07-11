# shk-madgim-server

## how to use

- install [nodejs]
- clone this repository
- run `node install` while in 'src' directory
- get yourself a [shk-madgim-client]
- run server: `node index.js client-location [port]` (default port to 8888)

## services

### data

- **initial** `/data/initial/<time>`
get all items existed in the specific time
- **range** `/data/range/<from-time>/<to-time>`
get all items generated between `from-time` and `to-time` (inclusive)

## references

- [naturalearth] has some high resolution vector maps layers
- [tessera] is a node server for serving tiles out of mbtiles file

[//]:#

[shk-madgim-client]: <http://https://github.com/SBD580/shk-madgim-client>
[nodejs]: <https://nodejs.org/en/download/>
[naturalearth]: <http://www.naturalearthdata.com/downloads/10m-cultural-vectors/>
[tessera]: <https://github.com/mojodna/tessera>
