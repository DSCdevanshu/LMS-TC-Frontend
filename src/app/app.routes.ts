import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './core/layout/app-shell/app-shell';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'home', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },

      // Profile
      {
        path: 'my-profile',
        data: { title: 'My Profile' },
        loadComponent: () => import('./features/profile/my-profile/my-profile').then(m => m.MyProfileComponent)
      },

      // Directory
      {
        path: 'directory',
        data: { title: 'Directory' },
        loadComponent: () => import('./features/directory/directory').then(m => m.DirectoryComponent)
      },

      // Employee Management
      {
        path: 'employees/manage',
        data: { title: 'Manage Employees' },
        loadComponent: () => import('./features/employee/employee-list/employee-list').then(m => m.EmployeeListComponent)
      },
      {
        path: 'employees/add',
        data: { title: 'Add Employee' },
        loadComponent: () => import('./features/employee/create-employee/create-employee').then(m => m.CreateEmployeeComponent)
      },
      {
        path: 'employees/:id/edit',
        data: { title: 'Edit Employee' },
        loadComponent: () => import('./features/employee/edit-employee/edit-employee').then(m => m.EditEmployeeComponent)
      },
      {
        path: 'employees/:id',
        data: { title: 'Employee Details' },
        loadComponent: () => import('./features/employee/employee-details/employee-details').then(m => m.EmployeeDetailsComponent)
      },

      // Leave Management
      {
        path: 'leaves/apply',
        data: { title: 'Apply Leave' },
        loadComponent: () => import('./features/leaves/create-leave/create-leave').then(m => m.CreateLeaveComponent)
      },
      {
        path: 'leaves/my-leaves',
        data: { title: 'My Leaves', leaveView: 'my' },
        loadComponent: () => import('./features/leaves/leave-list/leave-list').then(m => m.LeaveListComponent)
      },
      {
        path: 'leaves/team',
        data: { title: 'Team Leaves', leaveView: 'team' },
        loadComponent: () => import('./features/leaves/leave-list/leave-list').then(m => m.LeaveListComponent)
      },
      {
        path: 'leaves/all',
        data: { title: 'All Leaves', leaveView: 'all' },
        loadComponent: () => import('./features/leaves/leave-list/leave-list').then(m => m.LeaveListComponent)
      },
      {
        path: 'leaves/balances',
        data: { title: 'Leave Balances' },
        loadComponent: () => import('./features/leaves/leave-balance/leave-balance').then(m => m.LeaveBalanceComponent)
      },
      {
        path: 'leaves/:id',
        data: { title: 'Leave Details' },
        loadComponent: () => import('./features/leaves/leave-details/leave-details').then(m => m.LeaveDetailsComponent)
      },

      // Master Data
      {
        path: 'masters/departments',
        data: { title: 'Departments' },
        loadComponent: () => import('./features/employee/department-list/department-list').then(m => m.DepartmentListComponent)
      },
      {
        path: 'masters/designations',
        data: { title: 'Designations' },
        loadComponent: () => import('./features/employee/designation-list/designation-list').then(m => m.DesignationListComponent)
      },
      {
        path: 'masters/leave-types',
        data: { title: 'Leave Types' },
        loadComponent: () => import('./features/masters/leave-types/leave-types').then(m => m.LeaveTypesComponent)
      },
      {
        path: 'masters/locations',
        data: { title: 'Locations' },
        loadComponent: () => import('./features/masters/locations/locations').then(m => m.LocationsComponent)
      },
      {
        path: 'masters/holidays',
        data: { title: 'Holidays' },
        loadComponent: () => import('./features/masters/holidays/holidays').then(m => m.HolidaysComponent)
      },

      // Administration
      {
        path: 'admin/users',
        data: { title: 'Users' },
        loadComponent: () => import('./features/admin/user-access/user-access').then(m => m.UserAccessComponent)
      },
      {
        path: 'admin/roles',
        data: { title: 'Roles & Permissions' },
        loadComponent: () => import('./features/admin/role-list/role-list').then(m => m.RoleListComponent)
      },
      {
        path: 'admin/roles/new',
        data: { title: 'New Role' },
        loadComponent: () => import('./features/admin/role-edit/role-edit').then(m => m.RoleEditComponent)
      },
      {
        path: 'admin/roles/:id',
        data: { title: 'Edit Role' },
        loadComponent: () => import('./features/admin/role-edit/role-edit').then(m => m.RoleEditComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
