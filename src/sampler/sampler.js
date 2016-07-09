/**
 * Created by royif on 08/07/16.
 */
var axios = require('axios');
var planefinder = require('./planefinder')

var get = function (url, doIfDone) {
    return axios.get(url).then(function (data) {
        doIfDone(data);
    }).catch(function (error) {
        console.log(error);
    });
};

// exports
exports.planeFinderAircrafts = function (res) {
    var url = 'https://planefinder.net/endpoints/update.php?callback=planeDataCallback';
    return get(url, function (data) {
        res.send(planefinder.fullPlaneData(data));
    });
};
//TODO
exports.planeFinderDetailedAircraft = function (res) {
    var url = 'https://planefinder.net/endpoints/fullPlaneData.php?callback=planePlaybackMetadataCallback&adshex=394A18&flightno=AF565&ts=1468071724&isFAA=0';
    return get(url, function (data) {
        res.send(data.data);
    });
};
//TODO
exports.flightRadarAircrafts = function (res) {
    var url = 'https://data-live.flightradar24.com/zones/fcgi/feed.js';
    return get(url, function (data) {
        res.send(data.data);
    });
};
//TODO
exports.flightRadarDetailedAircraft = function (res) {
    var url = 'https://data-live.flightradar24.com/clickhandler/?version=1.5&';
    return get(url, function (data) {
        res.send(data.data);
    });
};
//TODO
exports.airlines = function (res) {
    var url = 'http://www.flightradar24.com/_json/airlines.php';
    return get(url, function (data) {
        res.send(data.data);
    });
};
//TODO
exports.airports = function (res) {
    var url = 'http://www.flightradar24.com/_json/airports.php';
    return get(url, function (data) {
        res.send(data.data);
    });
};
