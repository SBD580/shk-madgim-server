/**
 * Created by royif on 08/07/16.
 */
var axios = require('axios');
var planefinder = require('./planefinder');
var flightradar = require('./flightradar');

var get = function (url, doIfDone) {
    return axios.get(url).then(function (data) {
        doIfDone(data);
    }).catch(function (error) {
        console.log(error);
    });
};

// exports
exports.planeFinderAircrafts = function (req,res) {
    var url = 'https://planefinder.net/endpoints/update.php?callback=planeDataCallback';
    return get(url, function (data) {
        res.send(planefinder.fullPlaneData(data));
    });
};

exports.planeFinderDetailedAircraft = function (req,res) {
    var url = 'https://planefinder.net/endpoints/planeData.php?callback=planePlaybackMetadataCallback&adshex='
        + req.query.mode_s + '&flightno=' + req.query.flightno;
    return get(url, function (data) {
        res.send(planefinder.detailedPlaneData(data));
    });
};

exports.flightRadarAircrafts = function (req,res) {
    var url = 'https://data-live.flightradar24.com/zones/fcgi/feed.js';
    return get(url, function (data) {
        res.send(data.data);
    });
};

exports.flightRadarDetailedAircraft = function (req,res) {
    var url = 'https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=' + req.query.idx;
    return get(url, function (data) {
        res.send(data.data);
    });
};

exports.airlines = function (res) {
    var url = 'http://www.flightradar24.com/_json/airlines.php';
    return get(url, function (data) {
        res.send(flightradar.airlines(data.data));
    });
};

exports.airports = function (res) {
    var url = 'http://www.flightradar24.com/_json/airports.php';
    return get(url, function (data) {
        res.send(flightradar.airports(data.data));
    });
};
