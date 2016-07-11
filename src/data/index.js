var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var Promise = require('bluebird');
var turf = require('turf');

var client = new elasticsearch.Client({
    host: '10.132.0.2:9200',
    requestTimeout: 200000
    //log: 'trace'
});

var router = require('express').Router();

router.get('/:from/:to?',function(req,res){
	var limit = req.query.limit||50;
	var format = req.query.format||'json';
	var items = [];
	client.search({
		index: 'items',
		type: 'item',
		scroll: '30s',
		search_type: 'scan',
		body: {
			query: {
				range: {
					startTime: {
						gte: req.params.from,
						lte: req.params.to
					}
				}
			}
		}
	},function(err,r){
		if(err){
	                res.status(500).send(err);
			return;
		}

		r.hits.hits.forEach(function(hit){
			if(items.length<limit){
				items.push(_.assign({id:hit._id},hit._source));
			}
		});
		if(r.hits.total != items.length && items.length != limit){
			client.scroll({
				scrollId: r._scroll_id,
				scroll: '30s'
			},arguments.callee);	
		}else{
			if(format=='geojson'){
				res.json(turf.multiLineString(_.map(items,function(item){
					return item.path.coordinates;
				})));
			}else{
				res.json({
					total: r.hits.total,
					count: items.length,
					items
				});
			}
		}
	});
});

module.exports = router;
