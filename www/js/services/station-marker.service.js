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
            self.profecoExpirationMonths = station.profecoExpirationMonths;

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
                var totalRating

                if (profecoScore !== null) {
                    // Clear profeco score if its 6 months old
                    if ((Date.now() - self.profeco.auditDate) > (86400000*30)*self.profecoExpirationMonths) {
                        profecoScore = null;
                        self.profeco = null;
                    }
                }


                if (usersRating !== null && profecoScore !== null) {
                    totalRating = usersRating * profecoScore;
                }
                else if (usersRating !== null) {
                    totalRating = usersRating;
                }
                else if (profecoScore !== null) {
                    totalRating = (5 * profecoScore);
                }
                else {
                    totalRating = null;
                }

                return totalRating;
            }
        };

    });