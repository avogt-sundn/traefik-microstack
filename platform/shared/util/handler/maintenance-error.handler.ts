import {ErrorHandler, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceErrorHandler implements ErrorHandler {

  handleError(error: Error) {
    // Reload page on chunk loading error, e.g. lazy loading
    // ToDo
    // if (error.rejection != null && error.rejection.type === 'error' && /^.*\.js/.test(error.rejection.request)) {
    //   window.location.reload();
    // } else {
    throw error;
  }
}
