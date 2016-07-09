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
githooked('refs/heads/master', function (payload) {
    console.info('Receive post-update event, pulling...');

    if (payload.repository.name == 'shk-madgim-client') {
        console.info('pulling and installing client...');
        exec('git pull && npm install', {cwd: clientLocation}, function (err, stdout, stderr) {
            if (err) {
                console.error('failed pulling and installing client', err);
            } else {
                console.info('client pulled and installed successfully');
            }

            console.info('STDOUT:',stdout);
            console.info('STDERR:',stderr);
        });
    }

    if (payload.repository.name == 'shk-madgim-server') {
        console.info('pulling and installing app...');
        exec('git pull && npm install', {cwd: __dirname}, function (err, stdout, stderr) {
            if (err) {
                console.error('failed pulling and installing app', err);
            } else {
                console.info('app pulled and installed successfully');
            }

            console.info('STDOUT:',stdout);
            console.info('STDERR:',stderr);
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