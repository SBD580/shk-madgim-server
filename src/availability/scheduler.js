var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment')
var args = process.argv.slice(2);

var client = new elasticsearch.Client({
    // host: 'localhost:9200',
    host: '10.132.0.2:9200',
    requestTimeout: 200000
    //log: 'trace'
});

var interval = args[0]||3600; // in seconds, 'month' is a valid value as well
var removeExistingIndices = args[1]==='true';

var currentTime = Math.floor(Date.now()/1000);

createIndices(interval,removeExistingIndices).then(function() {
    return getAvailabilityMaxIndexTime(interval);
}).then(function(maxIndexTime){
    if(maxIndexTime>=currentTime) return;

    return getMinIndexedTime(maxIndexTime+1,currentTime).then(function(nextIndexedTime) {
        if(!nextIndexedTime) return currentTime;

        return getTimeRange(interval, nextIndexedTime, nextIndexedTime + 1).then(function (range) {
            var minTime = range[0];
            var maxTime = range[1];

            var promises = [];
            for (var time = minTime; time < maxTime; time = intervalAdd(time,interval)) {
                promises.push(calculateIntervalAvailability(time, intervalAdd(time,interval)));
            }
            return Promise.all(promises);
        }).then(function (results) {
            _.remove(results,function(result){
                return _.reduce(result.stats,function(sum,x){
                    return sum+x.count;
                },0)==0;
            });
            return Promise.join(client.bulk({
                index: 'availability',
                type: getIntervalDesc(interval),
                body: _.flatten(_.map(results,function(result){
                    return [{index:{_id:result.time}},result];
                }))
            })).then(function() {
                console.log(results.length + ' availability records were inserted');
            }).return(nextIndexedTime);
        });
    }).then(arguments.callee);
}).catch(console.error);

function calculateIntervalAvailability(startTime, endTime){
    return client.search({
        index: 'items',
        type: 'item',
        size: 0,
        body: {
            query: {
                constant_score: {
                    filter: {
                        bool: {
                            must: [
                                {range: { startTime: {lte: endTime}}},
                                {range: { endTime: {gt: startTime}}}
                            ]
                        }
                    }
                }
            },
            aggs: {
                sources: {
                    terms: {field: 'src',missing: 'T'}
                }
            }
        }
    }).then(function(r){
        return {
            time: startTime,
            stats: _.mapValues(_.groupBy(r.aggregations.sources.buckets,'key'),function(r){
                return {count: r[0].doc_count};
            }),
            maxIndexTime: currentTime
        };
    })/*.then(function(availability){
       return Promise.join(client.index({
           index: 'availability',
           type: interval+'s',
           id: availability.time,
           body: availability
       })).return(availability);
    })*/;
}

function getMinIndexedTime(startTime,endTime){
    return client.search({
        index: 'items',
        type: 'item',
        size: 0,
        body: {
            query: {
                constant_score: {
                    filter: {
                        range: {
                            indexed: {
                                gte: startTime,
                                lt: endTime
                            }
                        }
                    }
                }
            },
            aggs: {
                minIndexedTime: {min: {field: 'indexed'}},
            }
        }
    }).then(function (r) {
        return Math.floor(r.aggregations.minIndexedTime.value/1000);
    });
}

function getTimeRange(interval,minIndexedTime,maxIndexedTime){
    return client.search({
        index: 'items',
        type: 'item',
        size: 0,
        body: {
            query: {
                constant_score: {
                    filter: {
                        range: {
                            indexed: {
                                gte: minIndexedTime,
                                lt: maxIndexedTime
                            }
                        }
                    }
                }
            },
            aggs: {
                minTime: {min: {field: 'startTime'}},
                maxTime: {max: {field: 'endTime'}}
            }
        }
    }).then(function (r) {
        var minTime = Math.floor(r.aggregations.minTime.value / 1000);
            minTime = alignToPrevInterval(minTime,interval);
        var maxTime = Math.floor(r.aggregations.maxTime.value / 1000);
            maxTime = alignToNextInterval(maxTime,interval);

        return [minTime,maxTime];
    });
}

function getAvailabilityMaxIndexTime(interval){
    return client.search({
        index: 'availability',
        type: getIntervalDesc(interval),
        size: 0,
        body: {
            query: {
                constant_score: {
                    filter: {
                        match_all: {}
                    }
                }
            },
            aggs: {
                maxIndexTime: {max: {field: 'maxIndexTime'}}
            }
        }
    }).then(function(r){
       return Math.floor((r.aggregations.maxIndexTime.value||0)/1000);
    });
}

function createIndices(interval,removeExisting){
    return (removeExisting?client.indices.delete({
        index: 'availability'
    }):Promise.resolve(null)).then(function() {
        return client.indices.create({
            index: 'availability'
        }).catch(function (e) {
            if (e.body.error.type != 'index_already_exists_exception')
                throw e;
        }).then(function () {
            return client.indices.putMapping({
                index: 'availability',
                type: getIntervalDesc(interval),
                body: {
                    properties: {
                        time: {
                            type: 'date',
                            format: 'epoch_second'
                        },
                        maxIndexTime: {
                            type: 'date',
                            format: 'epoch_second'
                        }
                    }
                }
            });
        });
    });
}

function alignToNextInterval(time,interval){
    if(interval=='month')
        return moment.unix(time).add(1,'month').startOf('month').unix();

    interval = parseInt(interval);
    return Math.ceil(time/interval)*interval;
}

function alignToPrevInterval(time,interval){
    if(interval=='month')
        return moment.unix(time).startOf('month').unix();

    interval = parseInt(interval);
    return Math.floor(time/interval)*interval;
}

function intervalAdd(time,interval){
    if(interval=='month')
        return moment.unix(time).add(1,'month').unix();

    interval = parseInt(interval);
    return time+parseInt(interval);
}

function getIntervalDesc(interval){
    return interval=='month'?'1m':interval+'s';
}