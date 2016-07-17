/**
 * Created by royif on 09/07/16.
 */

var coorParser = require('parse-coordinates');

var jsonpStripper = function (str, regex) {
    var strippedJSONP = str.replace(regex, '');
    return JSON.parse(strippedJSONP);
};

exports.fullPlaneData = function (data) {
    /*
     * adshex == mode s
     *
     * 0 - craft type
     * 1 - registration
     * 2 - callsign
     * 3 - lat
     * 4 - longitude
     * 5 - altitude
     * 6 - heading
     * 7 - speed (knots)
     * 8 - ??
     * 9 - ??
     * 10 - flight no
     * 11 - departure-arrival string
     */
    if (data) {
        var json = jsonpStripper(data.data, /^planeDataCallback\(|\)$/g);
        var newPlanes = {};
        var planes = json["planes"];

        var okCrafts = 0;
        var badCrafts = 0;
        for (var idx in planes) {
            var plane = planes[idx];
            for (var adshex in plane) {
                var finderPlane = plane[adshex];
                var coordinates = finderPlane[3] + ',' + finderPlane[4];
                if (coorParser(coordinates) != null) {
                    var craft = [];
                    craft.push(finderPlane[0], finderPlane[1], finderPlane[2], finderPlane[3], finderPlane[4],
                        finderPlane[5], finderPlane[6], finderPlane[7], finderPlane[10], finderPlane[11]);
                    newPlanes[adshex] = craft;
                    ++okCrafts;
                } else {
                    ++badCrafts;
                }
            }
        }
        // console.log('total: ' + (okCrafts + badCrafts) + '; ok: ' + okCrafts + '; bad: ' + badCrafts);

        return newPlanes;
    }
    else {
        return {};
    }
};

exports.detailedPlaneData = function (data) {
    if (data) {
        var json = jsonpStripper(data.data, /^planePlaybackMetadataCallback\(|\)$/g);
        var airplane = {};
        for (var key in json) {
            if (key != "photos") {
                airplane[key] = json[key];
            }
        }
        return airplane;
    } else {
        return {};
    }
};
