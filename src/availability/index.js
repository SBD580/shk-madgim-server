var _ = require('lodash');
var Promise = require('bluebird');

module.exports = function(client) {
    var router = require('express').Router();

    router.get('/:interval/:start?/:end?', function (req, res) {
        var items = [];
        client.search({
            index: 'availability',
            type: req.params.interval,
            scroll: '30s',
            search_type: 'scan',
            body:{
                query: {
                    constant_score: {
                        filter: (req.params.start || req.params.end)?{
                            range: {
                                time: {
                                    gte: req.params.start,
                                    lte: req.params.end
                                }
                            }
                        }:{match_all:{}}
                    }
                }
            }
        }).then(function (r) {
            r.hits.hits.forEach(function (hit) {
                items.push(hit._source);
            });
            if (r.hits.total != items.length) {
                return client.scroll({
                    scrollId: r._scroll_id,
                    scroll: '30s'
                }).then(arguments.callee);
            } else {
                res.json(items);
            }
        }).catch(function (e) {
            res.status(500).send(e);
        });
    });

    return router;
}