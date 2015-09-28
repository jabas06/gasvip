angular.module('starter.config', [])
    // used for route security
    .constant('SECURED_ROUTES', {})
    .constant('LOGIN_REDIRECT_PATH', 'app.login')
    .constant('appConfig', {
      MAX_RATINGS_BY_USER: 2
    });
