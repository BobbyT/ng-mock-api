import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockApiInterceptor, provideMockApi } from '../../../ng-mock-api/src/lib';
import './mock-api'
export const appConfig: ApplicationConfig = {
  providers: [

    // provideMockApi(),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)],
};
