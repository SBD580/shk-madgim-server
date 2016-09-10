var commandLineArgs = require('command-line-args');
var usage = require('command-line-usage');
var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment-timezone');

// parse and validate options

var optionsDefinitions = [
    {
        name: 'interval',
        type: String,
        description: '(required) the interval to calculate by in <amount>-<unit> format (30-second, 15-minute etc)'
    },
    {
        name: 'timezone',
        type: String,
        defaultValue: moment.tz.guess(),
        description: 'the timezone to use (Asia/Jerusalem format), relevant for intervals of more then 1 hour (default to local timezone)'
    },
    {name: 'clean', type: Boolean, defaultValue: false, description: 'remove currently existing indices'},
    {
        name: 'elastic',
        type: String,
        defaultValue: 'localhost:9200',
        description: 'host:port for the elasticsearch instance (default to localhost:9200)'
    },
    {name: 'help', type: Boolean, description: 'print usage message and exit'}
];
var options = commandLineArgs(optionsDefinitions);

if (options.help) {
    console.error(usage({header: 'Options', optionList: optionsDefinitions}));
    process.exit(1);
}

options.interval = options.interval.split('-');

var client = new elasticsearch.Client({
    host: options.elastic,
    requestTimeout: 200000
});

var currentTime = Math.floor(Date.now() / 1000);

createIndices(options.interval, options.timezone, options.clean).then(function () {
    return getAvailabilityMaxIndexTime(options.interval, options.timezone);
}).then(function (maxIndexTime) {
    if (maxIndexTime >= currentTime) return;

    return getMinIndexedTime(maxIndexTime + 1, currentTime).then(function (nextIndexedTime) {
        if (!nextIndexedTime) return currentTime;

        return getTimeRange(options.interval, options.timezone, nextIndexedTime, nextIndexedTime + 1).then(function (range) {
            var minTime = range[0];
            var maxTime = range[1];

            var promises = [];
            for (var time = minTime; time < maxTime; time = intervalAdd(time, options.interval, options.timezone)) {
                promises.push(calculateIntervalAvailability(time, intervalAdd(time, options.interval, options.timezone)));
            }
            return Promise.all(promises);
        }).then(function (results) {
            _.remove(results, function (result) {
                return _.reduce(result.stats, function (sum, x) {
                        return sum + x.count;
                    }, 0) == 0;
            });
            return Promise.join(client.bulk({
                index: 'availability',
                type: getIndicesType(options.interval, options.timezone),
                body: _.flatten(_.map(results, function (result) {
                    return [{index: {_id: result.time}}, result];
                }))
            })).then(function () {
                console.log(results.length + ' availability records were inserted ('+getIndicesType(options.interval, options.timezone)+')');
            }).return(nextIndexedTime);
        });
    }).then(arguments.callee);
}).catch(console.error);

function calculateIntervalAvailability(startTime, endTime) {
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
                                {range: {startTime: {lte: endTime}}},
                                {range: {endTime: {gt: startTime}}}
                            ]
                        }
                    }
                }
            },
            aggs: {
                sources: {
                    terms: {field: 'src'}
                }
            }
        }
    }).then(function (r) {
        return {
            time: startTime,
            stats: _.mapValues(_.groupBy(r.aggregations.sources.buckets, 'key'), function (r) {
                return {count: r[0].doc_count};
            }),
            maxIndexTime: currentTime
        };
    });
}

function getMinIndexedTime(startTime, endTime) {
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
        return Math.floor(r.aggregations.minIndexedTime.value / 1000);
    });
}

function getTimeRange(interval, timezone, minIndexedTime, maxIndexedTime) {
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
        minTime = alignToPrevInterval(minTime, interval, timezone);
        var maxTime = Math.floor(r.aggregations.maxTime.value / 1000);
        maxTime = alignToNextInterval(maxTime, interval, timezone);

        return [minTime, maxTime];
    });
}

function getAvailabilityMaxIndexTime(interval, timezone) {
    return client.search({
        index: 'availability',
        type: getIndicesType(interval, timezone),
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
    }).then(function (r) {
        return Math.floor((r.aggregations.maxIndexTime.value || 0) / 1000);
    });
}

function createIndices(interval, timezone, removeExisting) {
    return (removeExisting ? client.indices.delete({
        index: 'availability'
    }) : Promise.resolve(null)).then(function () {
        return client.indices.create({
            index: 'availability'
        }).catch(function (e) {
            if (e.body.error.type != 'index_already_exists_exception')
                throw e;
        });
    }).then(function () {
        return client.indices.putMapping({
            index: 'availability',
            type: getIndicesType(interval, timezone),
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
}

function alignToNextInterval(time, interval, timezone) {
    var m = moment.tz(time*1000,timezone).startOf(interval[1]);
    if(m.unix()!=time) m = m.add(1,interval[1]);
    return m.add((interval[0]-m.get(interval[1])%interval[0])%interval[0],interval[1]+'s').unix();
}

function alignToPrevInterval(time, interval, timezone) {
    var m = moment.tz(time*1000,timezone).startOf(interval[1]);
    return m.subtract(m.get(interval[1])%interval[0],interval[1]+'s').unix();
}

function intervalAdd(time, interval, timezone) {
    return moment.tz(time*1000,timezone).add(interval[0],interval[1]).unix();
}

function getIndicesType(interval, timezone) {
    return getIntervalDesc(interval) + '_' + moment().tz(timezone).zoneAbbr();
}

function getIntervalDesc(interval) {
    return interval.join('-');
}