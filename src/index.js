var express = require('express');
var githooked = require('githooked');
var exec = require('child_process').exec;

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
githooked('refs/heads/master',function(payload){
    console.info('Receive post-update event, pulling...');

    if (payload.repository.name == 'shk-madgim-client') {
        gitpull(clientLocation, function (err, out) {
            if (err) {
                console.error('failed pulling directory ' + clientLocation, err, out);
            } else {
                console.info('pulled directory ' + clientLocation + ' successfully');
                console.info('installing client...');
                exec('npm install', {cwd: clientLocation});
            }
        });
    }

    if (payload.repository.name == 'shk-madgim-server') {
        gitpull(__dirname, function (err, out) {
            if (err) {
                console.error('failed pulling directory ' + __dirname, err, out);
            } else {
                console.info('pulled directory ' + __dirname + ' successfully');
                console.info('installing app...');
                exec('npm install', {cwd: __dirname},function(){
                    process.exit(0);
                });
            }
        });
    }
}).listen(9001);

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