var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var Promise = require('bluebird');
var turf = require('turf');

var client = new elasticsearch.Client({
    // host: 'localhost:9200',
    host: '10.132.0.2:9200',
    requestTimeout: 200000
    //log: 'trace'
});

var router = require('express').Router();

router.get('/range/:from/:to?', function (req, res) {
    var limit = req.query.limit || 50;
    var format = req.query.format || 'json';
    search({
        constant_score: {
            filter: {
                range: {
                    startTime: {
                        gte: req.params.from,
                        lte: req.params.to
                    }
                }
            }
        }
    }, limit).then(function (r) {
        if (format == 'geojson') {
            res.json(turf.multiLineString(_.map(r.items, function (item) {
                return item.path.coordinates;
            })));
        } else {
            res.json({
                total: r.total,
                count: r.items.length,
                items: r.items
            });
        }
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/initial/:time', function (req, res) {
    var format = req.query.format || 'json';
    search({
        constant_score: {
            filter: {
                bool: {
                    must: [
                        { range: {startTime: {lte: req.params.time}} },
                        { range: {endTime: {gt: req.params.time}} }
                    ]
                }
            }
        }
    }).then(function (r) {
        if (format == 'geojson') {
            res.json(turf.multiLineString(_.map(r.items, function (item) {
                return item.path.coordinates;
            })));
        } else {
            res.json({
                count: r.items.length,
                items: r.items
            });
        }
    }, function (err) {
        res.status(500).send(err);
    });
})
;

function search(query, limit) {
    var items = [];
    return client.search({
        index: 'items',
        type: 'item',
        scroll: '30s',
        search_type: 'scan',
        body: {
            query: query
        }
    }).then(function (r) {
        r.hits.hits.forEach(function (hit) {
            if (!limit || items.length < limit) {
                items.push(_.assign({id: hit._id}, hit._source));
            }
        });
        if (r.hits.total != items.length && (!limit || items.length != limit)) {
            return client.scroll({
                scrollId: r._scroll_id,
                scroll: '30s'
            }).then(arguments.callee);
        } else {
            return {
                items: items,
                total: r.hits.total
            };
        }
    });
}

module.exports = router;