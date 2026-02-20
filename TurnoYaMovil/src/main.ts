import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, Routes, withPreloading } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { authGuard } from './app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./app/features/auth/pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./app/features/auth/pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./app/home/home.page').then(m => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'businesses',
    loadComponent: () => import('./app/features/business/pages/list/business-list.page').then(m => m.BusinessListPage),
    canActivate: [authGuard],
  },
  {
    path: 'businesses/:id',
    loadComponent: () => import('./app/features/business/pages/detail/business-detail.page').then(m => m.BusinessDetailPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses',
    loadComponent: () => import('./app/features/owner-business/pages').then(m => m.BusinessListPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/:id/settings',
    loadComponent: () => import('./app/features/owner-business/pages').then(m => m.BusinessSettingsPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/create',
    loadComponent: () => import('./app/features/owner-business/pages').then(m => m.BusinessFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/:id/edit',
    loadComponent: () => import('./app/features/owner-business/pages').then(m => m.BusinessFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/:businessId/services',
    loadComponent: () => import('./app/features/owner-services/pages').then(m => m.ServicesListPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/:businessId/services/create',
    loadComponent: () => import('./app/features/owner-services/pages').then(m => m.ServiceFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'owner/businesses/:businessId/services/:serviceId/edit',
    loadComponent: () => import('./app/features/owner-services/pages').then(m => m.ServiceFormPage),
    canActivate: [authGuard],
  },
];

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(IonicModule.forRoot()),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
}).catch(err => console.log(err));
