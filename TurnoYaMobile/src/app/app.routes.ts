import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.page').then(m => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'business/list',
    loadComponent: () => import('./features/business/business-list/business-list.page').then(m => m.BusinessListPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/detail/:id',
    loadComponent: () => import('./features/business/business-detail/business-detail.page').then(m => m.BusinessDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/form',
    loadComponent: () => import('./features/business/business-form/business-form.page').then(m => m.BusinessFormPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/form/:id',
    loadComponent: () => import('./features/business/business-form/business-form.page').then(m => m.BusinessFormPage),
    canActivate: [authGuard]
  },
];
