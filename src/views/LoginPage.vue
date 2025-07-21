<template>
  <div class="login-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12">
          <div class="text-center mb-4">
            <h2 class="text-white">System Zarządzania Placówkami</h2>
            <p class="text-white-50">Zaloguj się aby uzyskać dostęp do systemu</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from '@/components/LoginForm.vue';

export default {
  name: 'LoginPage',
  components: {
    LoginForm,
  },
};
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #151717 0%, #051330 100%);
  min-height: calc(100vh - 160px); /* Odejmujemy wysokość header i footer */
  display: flex;
  align-items: center;
  padding: 2rem 0;
}

h2 {
  font-weight: 300;
  margin-bottom: 0.5rem;
}

.text-white-50 {
  opacity: 0.8;
}
</style>
