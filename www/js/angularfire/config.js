angular.module('firebase.config', [])
  .constant('FBURL', 'https://gasolineras.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['anonymous','facebook','google'])

  .constant('loginRedirectState', 'tab.login');
