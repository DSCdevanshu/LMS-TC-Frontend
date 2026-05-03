import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './core/layout/app-shell/app-shell';
import { Dashboard } from './features/dashboard/dashboard';
import { CreateEmployeeComponent } from './features/employee/create-employee/create-employee';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'create-employee',
        component: CreateEmployeeComponent
      },
      {
        path: 'add-employee',
        component: CreateEmployeeComponent
      },
      {
        path: 'AddEmployee',
        component: CreateEmployeeComponent
      },
      {
        path: 'addemployee',
        component: CreateEmployeeComponent
      },
      {
        path: 'employees/add',
        component: CreateEmployeeComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
