angular.module('starter.services')

    .factory('geoUtils', function() {

        // Default geohash length
        var g_GEOHASH_PRECISION = 10;

        // Characters used in location geohashes
        var g_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

        var service = {
            encodeGeohash: encodeGeohash
        };
        return service;

        ////////////

        /**
         * Generates a geohash of the specified precision/string length from the  [latitude, longitude]
         * pair, specified as an array.
         *
         * @param {Array.<number>} location The [latitude, longitude] pair to encode into a geohash.
         * @param {number=} precision The length of the geohash to create. If no precision is
         * specified, the global default is used.
         * @return {string} The geohash of the inputted location.
         */
        function encodeGeohash(location, precision) {
            validateLocation(location);
            if (typeof precision !== "undefined") {
                if (typeof precision !== "number" || isNaN(precision)) {
                    throw new Error("precision must be a number");
                }
                else if (precision <= 0) {
                    throw new Error("precision must be greater than 0");
                }
                else if (precision > 22) {
                    throw new Error("precision cannot be greater than 22");
                }
                else if (Math.round(precision) !== precision) {
                    throw new Error("precision must be an integer");
                }
            }

            // Use the global precision default if no precision is specified
            precision = precision || g_GEOHASH_PRECISION;

            var latitudeRange = {
                min: -90,
                max: 90
            };
            var longitudeRange = {
                min: -180,
                max: 180
            };
            var hash = "";
            var hashVal = 0;
            var bits = 0;
            var even = 1;

            while (hash.length < precision) {
                var val = even ? location[1] : location[0];
                var range = even ? longitudeRange : latitudeRange;
                var mid = (range.min + range.max) / 2;

                /* jshint -W016 */
                if (val > mid) {
                    hashVal = (hashVal << 1) + 1;
                    range.min = mid;
                }
                else {
                    hashVal = (hashVal << 1) + 0;
                    range.max = mid;
                }
                /* jshint +W016 */

                even = !even;
                if (bits < 4) {
                    bits++;
                }
                else {
                    bits = 0;
                    hash += g_BASE32[hashVal];
                    hashVal = 0;
                }
            }

            return hash;
        };

        /**
         * Validates the inputted location and throws an error if it is invalid.
         *
         * @param {Array.<number>} location The [latitude, longitude] pair to be verified.
         */
        function validateLocation (location) {
            var error;

            if (!Array.isArray(location)) {
                error = "location must be an array";
            }
            else if (location.length !== 2) {
                error = "expected array of length 2, got length " + location.length;
            }
            else {
                var latitude = location[0];
                var longitude = location[1];

                if (typeof latitude !== "number" || isNaN(latitude)) {
                    error = "latitude must be a number";
                }
                else if (latitude < -90 || latitude > 90) {
                    error = "latitude must be within the range [-90, 90]";
                }
                else if (typeof longitude !== "number" || isNaN(longitude)) {
                    error = "longitude must be a number";
                }
                else if (longitude < -180 || longitude > 180) {
                    error = "longitude must be within the range [-180, 180]";
                }
            }

            if (typeof error !== "undefined") {
                throw new Error("Invalid GeoFire location '" + location + "': " + error);
            }
        };

    });
