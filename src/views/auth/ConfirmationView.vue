// src/views/auth/ConfirmationView.vue
<template>
    <div class="confirmation-container">
        <h1>Verificación de correo</h1>
        <p>
            Ingresá el código que recibiste por mail para confirmar tu cuenta.
        </p>
        <v-text-field
            v-model="code"
            label="Código de verificación"
            outlined
            required
        />
        <v-btn :loading="loading" @click="verifyCode" color="primary">
            Confirmar
        </v-btn>
        <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { UserApi } from "@/api/user";

const code = ref("");
const loading = ref(false);
const message = ref("");
const error = ref(false);
const router = useRouter();

async function verifyCode() {
    if (!code.value) {
        message.value = "Ingresá un código válido";
        error.value = true;
        return;
    }
    loading.value = true;
    try {
        await UserApi.verify(code.value);
        message.value = "Verificación exitosa. Redirigiendo al login...";
        error.value = false;
        setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
        message.value = e.message || "Error al verificar el código";
        error.value = true;
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.confirmation-container {
    max-width: 400px;
    margin: 4rem auto;
    text-align: center;
}
.error {
    color: red;
}
</style>
