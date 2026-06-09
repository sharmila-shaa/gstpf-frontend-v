<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const isLoggedIn = computed(() => {
  return Boolean(localStorage.getItem("token"));
});

function logout() {
  localStorage.removeItem("token");
  router.push("/login");
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <router-link class="navbar-brand" to="/">
        GST Practitioner Locator
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNavbar" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">
              Home
            </router-link>
          </li>

          <li v-if="!isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/signup">
              Signup
            </router-link>
          </li>

          <li v-if="!isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/login">
              Login
            </router-link>
          </li>

          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/search">
              Search
            </router-link>
          </li>

          <li v-if="isLoggedIn" class="nav-item">
            <button class="btn btn-outline-light ms-lg-2" @click="logout">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>