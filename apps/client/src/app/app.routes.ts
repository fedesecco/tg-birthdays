import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard.page').then((module) => module.DashboardPageComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/add-contact.page').then((module) => module.AddContactPageComponent),
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./pages/contacts.page').then((module) => module.ContactsPageComponent),
  },
];
