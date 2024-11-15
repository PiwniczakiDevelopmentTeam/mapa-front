import { createRouter, createWebHistory } from 'vue-router';
import SchoolsPage from '../views/SchoolsPage.vue';

const routes = [
    { path: '/', component: SchoolsPage },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;