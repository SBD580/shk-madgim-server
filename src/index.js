var commandLineArgs = require('command-line-args');
var usage = require('command-line-usage');
var elasticsearch = require('elasticsearch');
var express = require('express');
var bodyParser = require('body-parser');

// parse and validate options

var optionsDefinitions = [
    {name: 'client', type: String, description: '(required) Path to client files for serving'},
    {name: 'port', type: Number, defaultValue: 8888, description: 'Port to listen to'},
    {name: 'elastic', type: String, defaultValue: 'localhost:9200', description: 'host:port for the elasticsearch instance'},
    {name: 'help', type: Boolean, defaultValue: false, description: 'print usage message and exit'}
];
var options = commandLineArgs(optionsDefinitions);

if(options.help){
    console.log(usage({header:'Options',optionList:optionsDefinitions}));
    process.exit(0);
}

if(!options.client){
    console.error(usage({header:'Options',optionList:optionsDefinitions}));
    process.exit(1);
}

// generate elasticsearch client for all modules

var client = new elasticsearch.Client({
    host: options.elastic,
    requestTimeout: 200000
});

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
app.use(express.static(options.client));

// serve client node modules files (hack, should be part of a build process at the client)
app.use('/lib', express.static(options.client+'/../node_modules'));

// serve static files
app.use('/static', express.static(__dirname + '/static'));

// rest handling for data sniffer
app.use('/r',require('./sampler'));

// handle data requests
app.use('/data',require('./data')(client));

// handle data availability requests
app.use('/availability',require('./availability')(client));

// handle search requests
app.use('/search',require('./search')(client));

app.listen(options.port, function () {
    console.log('Server is up and running. Listening on port ' + options.port);
});
