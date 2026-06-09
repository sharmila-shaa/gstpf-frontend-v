<template>
  <section class="container py-5">
    <div class="p-5 bg-light rounded-3 shadow-sm">
      <h1 class="display-6 fw-bold">
        GST Practitioner Locator
      </h1>

      <p class="lead mt-3">
        Search for GST Practitioners across India using a six-digit pincode.
      </p>

      <div class="mt-4">
        <router-link class="btn btn-primary me-2" to="/search">
          Search Practitioner
        </router-link>

        <router-link class="btn btn-outline-primary" to="/signup">
          Create Account
        </router-link>
      </div>
    </div>
  </section>
</template>