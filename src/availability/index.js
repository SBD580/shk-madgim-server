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

router.get('/:interval',function(req,res){
    var items = [];
    client.search({
        index: 'availability',
        type: req.params.interval,
        scroll: '30s',
        search_type: 'scan'
    }).then(function(r){
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
    }).catch(function(e){
        res.status(500).send(e);
    });
});

module.exports = router;