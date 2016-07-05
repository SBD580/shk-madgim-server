var express = require('express');

var args = process.argv.slice(2);

// get client location
var clientLocation = args[0];
if(!clientLocation){
	console.error('usage: index.js client-location [port]');
	process.exit();
}

// get server port
var port = args[1] || 8888;

var app = express();

// serve client files
app.use(express.static(clientLocation));

// serve static files
app.use('/static',express.static(__dirname+'/static'));

app.listen(port,function(){
	console.log('Server is up and running. Listening on port '+port);
});