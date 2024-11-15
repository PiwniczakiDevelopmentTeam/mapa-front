<template>
    <div class="app-profile me-5">
      <img
        src="https://via.placeholder.com/80"
        alt="Profile"
        class="rounded-circle profile-pic"
        id="profileDropdown"
        data-bs-toggle="dropdown"
      />
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
        <li><a class="dropdown-item" href="#">Profil</a></li>
        <li><a class="dropdown-item" href="#">Ustawienia</a></li>
        <li><a class="dropdown-item" href="#">Wyloguj</a></li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: "AppProfile",
  };
  </script>
  
  <style scoped>
  .profile-pic {
    width: 80px;
    height: 80px;
    cursor: pointer;
  }
  </style>
  