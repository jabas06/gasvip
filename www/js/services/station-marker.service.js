angular.module('starter.services')
    .factory('StationMarker',  function(){

        return function StationMarker(station, key, stationMarkerClickClosure, isUserLogguedIn){

            var self = this;

            self.id = key;
            self.latitude = station.lat;
            self.longitude = station.lon;
            self.name = station.name;
            self.rating = station.rating;
            self.profeco = station.profeco;

            self.options= {
                visible: true
            };

            self.onClick = stationMarkerClickClosure(self);

            self.refreshMarkerRating = refreshMarkerRating;

            refreshMarkerRating();
            // *********************************
            // Internal
            // *********************************

            function refreshMarkerRating() {
                self.ratingValue = getRatingValue();
                self.icon = self.ratingValue >= 4 && isUserLogguedIn === true ? 'img/green-pin.png' : 'img/gray-pin.png';
                self.image = self.ratingValue >= 4 && isUserLogguedIn === true? 'img/green-station.png' : 'img/gray-station.png';
            }

            function getRatingValue() {
                var usersRating = self.rating ? self.rating.sum / self.rating.count : null;
                var profecoScore = self.profeco ? self.profeco.score : null;
                var totalRating;

                if (usersRating && profecoScore) {
                    totalRating = usersRating * profecoScore;
                }
                else if (usersRating) {
                    totalRating = usersRating;
                }
                else if (profecoScore) {
                    totalRating = (5 * profecoScore);
                }
                else {
                    totalRating = null;
                }

                return totalRating;
            }
        };

    });