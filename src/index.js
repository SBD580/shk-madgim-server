var express = require('express');

var args = process.argv.slice(2);

// get client location
var clientLocation = args[0];
if (!clientLocation) {
    console.error('usage: index.js client-location [port]');
    process.exit();
}

// get server port
var port = args[1] || 8888;

var app = express();

// add CORS headers so local development clients could query the server
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// serve client files
app.use(express.static(clientLocation));

// serve static files
app.use('/static', express.static(__dirname + '/static'));

// rest handling for data sniffer
var sampler = require('./sampler/sampler');

app.get('/resources/planeFinderAircrafts', function (req, res) {
    sampler.planeFinderAircrafts(res);
});

app.get('resources/planeFinderDetailedAircraft', function (req, res) {
    sampler.planeFinderDetailedAircraft(res);
});

app.get('/resources/flightRadarAircrafts', function (req, res) {
    sampler.flightRadarAircrafts(res);
});

app.get('resources/flightRadarDetailedAircraft', function (req, res) {
    sampler.flightRadarDetailedAircraft(res);
});

app.get('/resources/airlines', function (req, res) {
    sampler.airlines(res);
});

app.get('/resources/airports', function (req, res) {
    sampler.airports(res);
});

// handle data requests
app.use('/data',require('./data'));

app.listen(port, function () {
    console.log('Server is up and running. Listening on port ' + port);
});
