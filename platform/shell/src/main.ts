import { initFederation } from '@angular-architects/native-federation';

const g = globalThis as any;
if (typeof g.ngDevMode === 'undefined') {
    g.ngDevMode = false;
}

initFederation('/environments/federation.manifest.json')
  .then(() => import('./bootstrap'))
