import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import HomePage from "@/views/HomePage.vue";
// import { useUserStore } from "@/stores/userStore";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// TODO: odkomentowac w prod

// router.beforeEach((to, _from, next) => {
//   const userStore = useUserStore();

//   if (to.meta.requiresAuth && !userStore.isAuthenticated) {
//     next({
//       path: "/login",
//       query: { redirect: to.fullPath },
//     });
//   } else if (to.path === "/login" && userStore.isAuthenticated) {
//     next("/");
//   } else {
//     next();
//   }
// });

export default router;
