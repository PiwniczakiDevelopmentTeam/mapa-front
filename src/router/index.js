import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import SchoolsPage from '../views/SchoolsPage.vue';
import SchoolEditPage from '../views/SchoolEdit.vue';
import SchoolAdd from '../views/SchoolAdd.vue';
import DeleteSchools from '../views/DeleteSchools.vue';
import NewSchools from '@/views/NewSchools.vue';
import UpdateSchools from '@/views/UpdateSchools.vue';
import LoginPage from '@/views/LoginPage.vue';
import AdminPage from '@/views/AdminPage.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { 
      requiresAuth: false,
      hideNavigation: true 
    }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schools',
    component: SchoolsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/schools/edit/:rspo',
    name: 'SchoolEdit',
    component: SchoolEditPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/schools/new',
    name: 'NewSchools',
    component: NewSchools,
    meta: { requiresAuth: true }
  },
  {
    path: '/schools/update',
    name: 'UpdateSchools',
    component: UpdateSchools,
    meta: { requiresAuth: true }
  },
  {
    path: '/schools/add/:rspo',
    name: 'SchoolAdd',
    component: SchoolAdd,
    meta: { requiresAuth: true }
  },
  {
    path: '/schools/delete',
    name: 'SchoolDelete',
    component: DeleteSchools,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Router guard dla autoryzacji
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const requiresAuth = to.meta.requiresAuth !== false;
  
  if (requiresAuth && !userStore.isAuthenticated) {
    // Przekieruj na stronę logowania z informacją o tym gdzie użytkownik chciał iść
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  } else if (to.path === '/login' && userStore.isAuthenticated) {
    // Jeśli użytkownik jest już zalogowany i próbuje wejść na stronę logowania,
    // przekieruj go na stronę główną
    next('/');
  } else {
    next();
  }
});

export default router;
