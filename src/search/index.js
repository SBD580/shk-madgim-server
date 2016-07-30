var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var Promise = require('bluebird');

var client = new elasticsearch.Client({
    // host: 'localhost:9200',
    host: '10.132.0.2:9200',
    requestTimeout: 200000
    //log: 'trace'
});

var router = require('express').Router();

router.use('/', function (req, res) {
    var shape = req.query.shape || req.body.shape;
    if (!shape) return res.json([]);

    client.search({
        index: 'items',
        type: 'item',
        body: {
            query: {
                constant_score: {
                    filter: {
                        geo_shape: {
                            path: {
                                shape: shape
                            }
                        }
                    }
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

module.exports = router;