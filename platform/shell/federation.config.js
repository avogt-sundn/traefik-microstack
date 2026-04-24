const {withNativeFederation, shareAll} = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({

  name: 'shell',

  // exposes: {
  //   './AuthModule': './src/shared/auth/index.ts',
  // },

  shared: {
    ...shareAll({singleton: true, strictVersion: true, requiredVersion: 'auto'}),
    'rxjs': {singleton: true, strictVersion: false},
    '@angular/platform-browser': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    '@angular/material': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    '@angular/cdk': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    '@jsverse/transloco': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    'angular-oauth2-oidc': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true
  }

});
