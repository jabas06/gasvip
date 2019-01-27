(function() {
  "use strict";
  angular
    .module("gasvip")

    // ------------------------

    // used for route security
    .constant("SECURED_ROUTES", {})
    .constant("LOGIN_REDIRECT_PATH", "app.login")
    .constant("appConfig", {
      MAX_RATINGS_BY_USER: 2
    })

    .constant("VERSION", "1.0")

    .constant("$ionicLoadingConfig", {
      template: "<ion-spinner></ion-spinner>",
      noBackdrop: true,
      duration: 15000
    })

    .constant("FirebaseUrl", "<databaseURL>")
    .constant("SIMPLE_LOGIN_PROVIDERS", ["anonymous", "facebook"])
    // ------------------------
    .config(function(uiGmapGoogleMapApiProvider) {
      uiGmapGoogleMapApiProvider.configure({
        key: "<maps_api_key>",
        v: "3.36",
        libraries: "places"
      });
    })
    .config(function(FirebaseUrl, $firebaseRefProvider) {
      // Initialize Firebase
      var config = {
        apiKey: "<firebase_api_key>",
        authDomain: "<authDomain>",
        databaseURL: FirebaseUrl,
        projectId: "<projectId>",
        storageBucket: "<storageBucket>",
        messagingSenderId: "<messagingSenderId>"
      };
      firebase.initializeApp(config);

      $firebaseRefProvider.registerUrl({
        default: FirebaseUrl,
        geofire: FirebaseUrl + "geofire",
        users: FirebaseUrl + "users",
        stations: FirebaseUrl + "stations",
        ratings: FirebaseUrl + "ratings",
        ratingsByStation: FirebaseUrl + "ratingsByStation"
      });
    });
})();
