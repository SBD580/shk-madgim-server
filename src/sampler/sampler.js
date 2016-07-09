/**
 * Created by royif on 08/07/16.
 */
var axios = require('axios');

var get = function (url, doIfDone) {
    return axios.get(url).then(function (data) {
        doIfDone(data);
    }).catch(function (error) {
        console.log(error);
    });
}

module.exports = {
    aircrafts: function (res) {
        return get('https://planefinder.net/endpoints/update.php?callback=planeDataCallback', function (data) {
            res.send(data.data);
        });
    },
    airlines: function (res) {
        return get('http://www.flightradar24.com/_json/airlines.php', function (data) {
            res.send(data.data);
        });
    },
    airports: function (res) {
        return get('http://www.flightradar24.com/_json/airports.php', function (data) {
            res.send(data.data);
        });
    }
};