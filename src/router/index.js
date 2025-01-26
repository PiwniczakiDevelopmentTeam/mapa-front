import { createRouter, createWebHistory } from 'vue-router';
import SchoolsPage from '../views/SchoolsPage.vue';
import SchoolEditPage from '../views/SchoolEdit.vue';
import SchoolAdd from '../views/SchoolAdd.vue';
import DeleteSchools from '../views/DeleteSchools.vue';
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
  },
  {
    path: '/schools/add',
    name: 'SchoolAdd',
    component: SchoolAdd
  },
  {
    path: '/schools/delete',
    name: 'SchoolDelete',
    component: DeleteSchools
  }
  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
