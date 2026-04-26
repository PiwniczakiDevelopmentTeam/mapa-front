import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import HomePage from "@/views/HomePage.vue";
import SchoolsPage from "@/views/SchoolsPage.vue";
import ImportPage from "@/views/ImportPage.vue";
import AuditPage from "@/views/AuditPage.vue";
import ErrorsPage from "@/views/ErrorsPage.vue";
import UsersPage from "@/views/UsersPage.vue";
import SchoolEditPage from "@/views/SchoolEditPage.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    name: "Home",
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/placowki",
    name: "Schools",
    component: SchoolsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/import",
    name: "Import",
    component: ImportPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/audyt",
    name: "Audit",
    component: AuditPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/bledy",
    name: "Errors",
    component: ErrorsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/uzytkownicy",
    name: "Users",
    component: UsersPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/placowki/:rspoId/edytuj",
    name: "SchoolEdit",
    component: SchoolEditPage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
