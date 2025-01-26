<template>
  <div class="container-fluid main-project-container">
    <div id="app" class="d-flex flex-column min-vh-100">
    <AppHeader />
      <router-view />
    <AppFooter />
    </div>  
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';

export default {
  components: {
    AppHeader,
    AppFooter,
  },
};
</script>

<style scoped>
#app{
  background-color: #151717;
}
.main-project-container{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
}
</style>
