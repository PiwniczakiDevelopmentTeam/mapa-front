import { createRouter, createWebHistory } from 'vue-router';
import SchoolsPage from '../views/SchoolsPage.vue';
import SchoolEditPage from '../views/SchoolEdit.vue';

const routes = [
  {
    path: '/',
    component: SchoolsPage
  },
  {
    path: '/school/:id/edit',
    name: 'SchoolEdit',
    component: SchoolEditPage
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
