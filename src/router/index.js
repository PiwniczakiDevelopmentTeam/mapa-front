import { createRouter, createWebHistory } from 'vue-router';
import SchoolsPage from '../views/SchoolsPage.vue';
import SchoolEditPage from '../views/SchoolEdit.vue';
import NewSchools from '@/views/NewSchools.vue';
import UpdateSchools from '@/views/UpdateSchools.vue';

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
  {
    path: '/schools/new',
    name: 'NewSchools',
    component: NewSchools
  },
  {
    path: '/schools/update',
    name: 'UpdateSchools',
    component: UpdateSchools
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
