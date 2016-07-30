var express = require('express');
var bodyParser = require('body-parser');

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

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));

// serve client files
app.use(express.static(clientLocation));

// serve static files
app.use('/static', express.static(__dirname + '/static'));

// rest handling for data sniffer
app.use('/resources',require('./sampler'));

// handle data requests
app.use('/data',require('./data'));

// handle data availability requests
app.use('/availability',require('./availability'));

// handle search requests
app.use('/search',require('./search'));

app.listen(port, function () {
    console.log('Server is up and running. Listening on port ' + port);
});
