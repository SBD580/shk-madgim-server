/**
 * Created by royif on 13/07/16.
 */
var router = require('express').Router();
var sampler = require('./sampler');

router.get('/planeFinderAircrafts', function (req, res) {
    sampler.planeFinderAircrafts(res);
});

router.get('/planeFinderDetailedAircraft', function (req, res) {
    sampler.planeFinderDetailedAircraft(res);
});

router.get('/flightRadarAircrafts', function (req, res) {
    sampler.flightRadarAircrafts(res);
});

router.get('/flightRadarDetailedAircraft', function (req, res) {
    sampler.flightRadarDetailedAircraft(res);
});

router.get('/airlines', function (req, res) {
    sampler.airlines(res);
});

router.get('/airports', function (req, res) {
    sampler.airports(res);
});

module.exports = router;