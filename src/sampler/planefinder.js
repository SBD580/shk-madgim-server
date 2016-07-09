/**
 * Created by royif on 09/07/16.
 */

var coorParser = require('parse-coordinates');

/*
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
exports.fullPlaneData = function (data) {
    var strippedJSONP = data.data.replace(/^planeDataCallback\(|\)$/g, '');
    var json = JSON.parse(strippedJSONP);
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
};

exports.detailedPlaneData = function (data) {
    
}