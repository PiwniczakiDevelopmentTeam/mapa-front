<template>
    <header class="app-header">
      <!--<div class="header-top d-flex justify-content-between align-items-center p-2 bg-dark text-white">
        <AppLogo />
        <AppProfile />
      </div>-->
      <div class="header-menu">
        <AppMainMenu />
      </div>
    </header>
  </template>
  
<script>
    import AppMainMenu from "./AppHeaderComponents/AppMainMenu.vue";


    export default {
        name: 'AppHeader',
        components: {
        AppMainMenu,
        },
    };
</script>

<style scoped>
    .header-top {
        background-color: #151717;
    }

    .header-menu{
        background-color: #051330;
    }
</style>