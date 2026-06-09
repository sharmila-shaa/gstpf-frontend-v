<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../services/api";

const router = useRouter();

const email = ref("");
const password = ref("");

const isLoading = ref(false);
const errorMessage = ref("");

async function submitLogin() {
  errorMessage.value = "";

  if (!email.value || !password.value) {
    errorMessage.value = "Please enter your email and password.";
    return;
  }

  try {
    isLoading.value = true;

    const response = await loginUser({
      email: email.value.trim(),
      password: password.value,
    });

    const token =
      response.token ||
      response.data?.token;

    if (!token) {
      throw new Error("Login succeeded, but the token was not returned.");
    }

    localStorage.setItem("token", token);

    router.push("/search");
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
        <h2 class="text-center mb-4">Login</h2>

        <div
          v-if="errorMessage"
          class="alert alert-danger"
        >
          {{ errorMessage }}
        </div>

        <form @submit.prevent="submitLogin">
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
            {{ isLoading ? "Checking..." : "Login" }}
          </button>
        </form>

        <p class="text-center mt-3 mb-0">
          New user?
          <router-link to="/signup">
            Create an account
          </router-link>
        </p>
      </div>
    </div>
  </section>
</template>