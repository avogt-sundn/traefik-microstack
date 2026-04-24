const {withNativeFederation, shareAll} = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({

  name: 'partner-search',

  exposes: {
    './Component': './src/app/app.ts',
    './Routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({singleton: true, strictVersion: true, requiredVersion: 'auto'}),
    'rxjs': {singleton: true, strictVersion: false},
    '@angular/platform-browser': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    '@jsverse/transloco': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    'angular-oauth2-oidc': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    // @angular/cdk/* and @angular/material/* sub-entries use InjectionTokens whose
    // identity is object-reference-sensitive. When a different remote's version wins
    // the singleton race (non-deterministic with parallel fetching), token mismatches
    // cause NG0201. These are explicitly NOT shared so each remote is self-contained.
    '@angular/cdk': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
    '@angular/material': {singleton: true, strictVersion: true, requiredVersion: 'auto'},
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
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
