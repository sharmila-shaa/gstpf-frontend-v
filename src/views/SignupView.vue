<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { signupUser } from "../services/api";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");

const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

async function submitSignup() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!name.value || !email.value || !password.value) {
    errorMessage.value = "Please enter your name, email, and password.";
    return;
  }

  try {
    isLoading.value = true;

    const response = await signupUser({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });

    successMessage.value =
      response.message || "Signup completed successfully.";

    setTimeout(() => {
      router.push("/login");
    }, 1000);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section class="container py-5">
    <div class="card shadow-sm mx-auto" style="max-width: 440px">
      <div class="card-body p-4">
        <h2 class="text-center mb-4">Create Account</h2>

        <div
          v-if="errorMessage"
          class="alert alert-danger"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="alert alert-success"
        >
          {{ successMessage }}
        </div>

        <form @submit.prevent="submitSignup">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input
              v-model="name"
              class="form-control"
              type="text"
              placeholder="Enter your name"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model="email"
              class="form-control"
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input
              v-model="password"
              class="form-control"
              type="password"
              placeholder="Enter your password"
            />
          </div>

          <button
            class="btn btn-primary w-100"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? "Creating Account..." : "Signup" }}
          </button>
        </form>

        <p class="text-center mt-3 mb-0">
          Already registered?
          <router-link to="/login">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </section>
</template>