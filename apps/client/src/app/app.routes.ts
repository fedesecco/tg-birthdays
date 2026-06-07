import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((module) => module.DashboardPageComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/add-contact/add-contact').then((module) => module.AddContactPageComponent),
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./pages/contacts/contacts').then((module) => module.ContactsPageComponent),
  },
  {
    path: 'upcoming',
    loadComponent: () =>
      import('./pages/upcoming/upcoming').then((module) => module.UpcomingPageComponent),
  },
];
