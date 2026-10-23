import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';

import { erroInterceptor } from './core/erro.interceptor';
import { routes } from './app.routes';
import * as categoriasEffects from './store/categorias/categorias.effects';
import { categoriasFeature } from './store/categorias/categorias.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([erroInterceptor])),
    provideStore(),
    provideState(categoriasFeature),
    provideEffects(categoriasEffects),
  ],
};
