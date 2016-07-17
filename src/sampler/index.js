/**
 * Created by royif on 13/07/16.
 */
var router = require('express').Router();
var sampler = require('./sampler');

router.get('/planeFinderAircrafts', function (req, res) {
    sampler.planeFinderAircrafts(req,res);
});

router.get('/planeFinderDetailedAircraft', function (req, res) {
    sampler.planeFinderDetailedAircraft(req,res);
});

router.get('/flightRadarAircrafts', function (req, res) {
    sampler.flightRadarAircrafts(req,res);
});

router.get('/flightRadarDetailedAircraft', function (req, res) {
    sampler.flightRadarDetailedAircraft(req,res);
});

router.get('/airlines', function (req, res) {
    sampler.airlines(req,res);
});

router.get('/airports', function (req, res) {
    sampler.airports(req,res);
});

module.exports = router;