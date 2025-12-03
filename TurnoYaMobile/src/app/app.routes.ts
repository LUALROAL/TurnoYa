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
  {
    path: 'business/:businessId/services',
    loadComponent: () => import('./features/business/services/service-list.page').then(m => m.ServiceListPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/:businessId/services/form',
    loadComponent: () => import('./features/business/services/service-form.page').then(m => m.ServiceFormPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/:businessId/services/form/:id',
    loadComponent: () => import('./features/business/services/service-form.page').then(m => m.ServiceFormPage),
    canActivate: [authGuard]
  },
  {
    path: 'appointments/list',
    loadComponent: () => import('./features/appointments/list/appointments-list.page').then(m => m.AppointmentsListPage),
    canActivate: [authGuard]
  },
  {
    path: 'appointments/detail/:id',
    loadComponent: () => import('./features/appointments/detail/appointment-detail.page').then(m => m.AppointmentDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'appointments/create',
    loadComponent: () => import('./features/appointments/create/appointment-create.page').then(m => m.AppointmentCreatePage),
    canActivate: [authGuard]
  },
  {
    path: 'business/:businessId/employees',
    loadComponent: () => import('./features/business/employees/employee-list.page').then(m => m.EmployeeListPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/:businessId/employees/form',
    loadComponent: () => import('./features/business/employees/employee-form.page').then(m => m.EmployeeFormPage),
    canActivate: [authGuard]
  },
  {
    path: 'business/:businessId/employees/form/:id',
    loadComponent: () => import('./features/business/employees/employee-form.page').then(m => m.EmployeeFormPage),
    canActivate: [authGuard]
  },
  {
    path: 'appointments/business/:businessId',
    loadComponent: () => import('./features/appointments/business/business-appointments.page').then(m => m.BusinessAppointmentsPage),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
];
