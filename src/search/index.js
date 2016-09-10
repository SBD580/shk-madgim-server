var _ = require('lodash');
var Promise = require('bluebird');

module.exports = function (client) {
    var router = require('express').Router();

    router.use('/', function (req, res) {
        var shape = req.query.shape || req.body.shape;
        var start = req.query.start || req.body.start;
        var end = req.query.end || req.body.end;
        var sources = req.query.sources || req.body.sources;
        var types = req.query.types || req.body.types;

        var conds = [];
        if (shape) {
            conds.push({
                geo_shape: {
                    path: {
                        shape: shape
                    }
                }
            });
        }
        if (end) {
            conds.push({
                range: {
                    startTime: {
                        lte: end
                    }
                }
            });
        }
        if (start) {
            conds.push({
                range: {
                    endTime: {
                        gt: start
                    }
                }
            });
        }
        if (sources && sources.length) {
            conds.push({terms: {src: sources}});
        }
        if (types && types.length) {
            conds.push({terms: {type: types}});
        }

        client.search({
            index: 'items',
            type: 'item',
            body: {
                query: {
                    bool: {
                        filter: conds
                    }
                }
            }
        }).then(function (r) {
            res.json({
                total: r.hits.total,
                results: _.map(r.hits.hits, function (hit) {
                    return hit._source;
                })
            });
        }).catch(function (e) {
            res.status(500).send(e);
        })
    });

    return router;
}