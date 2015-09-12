angular.module('starter.services')
    .factory('StationMarker',  function(){

        return function StationMarker(station, key, stationMarkerClickClosure){

            var self = this;

            self.id = key;
            self.latitude = station.lat;
            self.longitude = station.lon;
            self.name = station.name;
            self.rating = station.rating;
            self.profeco = station.profeco;

            self.onClick = stationMarkerClickClosure(self);

            self.refreshMarkerRating = refreshMarkerRating;

            refreshMarkerRating();
            // *********************************
            // Internal
            // *********************************

            function refreshMarkerRating() {
                self.ratingValue = getRatingValue();
                self.icon = self.ratingValue >= 4 ? 'img/green-pin.png' : 'img/gray-pin.png';
                self.image = self.ratingValue >= 4 ? 'img/green-station.png' : 'img/gray-station.png';
            }

            function getRatingValue() {
                var usersRating = self.rating ? self.rating.sum / self.rating.count : null;
                var profecoScore = self.profeco ? 1 - (self.profeco.immobilizedPumps/self.profeco.gasolinePumps) : null;
                var totalRating;

                if (usersRating && profecoScore) {
                    totalRating = ((5 * profecoScore) + usersRating) / 2;
                }
                else if (usersRating) {
                    totalRating = usersRating;
                }
                else if (profecoScore) {
                    totalRating = (5 * profecoScore);
                }
                else {
                    totalRating = 0;
                }

                return totalRating;
            }
        };

    });