var express = require('express');
var gith = require('gith').create(9001);
var gitpull = require('git-pull')

var args = process.argv.slice(2);

// get client location
var clientLocation = args[0];
if (!clientLocation) {
    console.error('usage: index.js client-location [port]');
    process.exit();
}

// get server port
var port = args[1] || 8888;

// git hooks support
gith({
	repo: 'SBD580/shk-madgim-server',
	branch: 'master'
}).on('all',function(){
	console.info('Receive post-update event, pulling...');
	gitpull(__dirname,function(err,out){
		if(err)
			console.error('failed pulling directory',err,out);
		else
			console.info('pulled successfully');
	});
});

var app = express();

// serve client files
app.use(express.static(clientLocation));

// serve static files
app.use('/static', express.static(__dirname + '/static'));

app.listen(port, function () {
    console.log('Server is up and running. Listening on port ' + port);
});

// rest handling for data sniffer
var sampler = require('./sampler/sampler');

app.get('/resources/aircrafts', function (req, res) {
    sampler.aircrafts(res);
});

app.get('/resources/airlines', function (req, res) {
    sampler.airlines(res);
});

app.get('/resources/airports', function (req, res) {
    sampler.airports(res);
});