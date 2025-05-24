// src/views/auth/ConfirmationView.vue
<template>
    <v-container class="login-bg" fluid>
        <v-row justify="center" align="center" class="ma-0">
            <v-col cols="12" sm="8" md="5" lg="4">
                <BackButton to="/" class="d-flex justify-center" />
                <v-card class="pa-8 login-bg-card" elevation="0">
                    <div class="text-center mb-2">
                        <h1 class="login-title mb-1">WIBA</h1>
                        <div class="login-subtitle mb-6">Virtual Wallet Application</div>
                    </div>
                    <div class="text-center mb-6">
                        <h2 class="confirmation-title">Verificación de correo</h2>
                        <p class="confirmation-subtitle">
                            Ingresá el código que recibiste por mail para confirmar tu cuenta.
                        </p>
                    </div>
                    <v-form @submit.prevent="verifyCode" ref="form">
                        <CustomTextField
                            v-model="code"
                            label="Código de verificación"
                            placeholder="Ingresá el código"
                            :error="!!message && error"
                            :errorMessage="message"
                        />
                        <FilledButton
                            type="submit"
                            class="login-btn mb-4"
                            :disabled="loading"
                            :fullWidth="true"
                        >
                            {{ loading ? 'Verificando...' : 'Confirmar' }}
                        </FilledButton>
                    </v-form>
                    <div class="text-center mt-2">
                        <span>¿No recibiste el código?</span>
                        <a href="#" @click.prevent="resendCode" class="login-link">Reenviar código</a>
                    </div>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSecurityStore } from "@/stores/securityStore";
import CustomTextField from '@/components/ui/CustomTextField.vue';
import FilledButton from '@/components/ui/FilledButton.vue';
import BackButton from '@/components/ui/BackButton.vue';

const code = ref("");
const loading = ref(false);
const message = ref("");
const error = ref(false);
const router = useRouter();
const securityStore = useSecurityStore();
const route = useRoute();

async function verifyCode() {
    if (!code.value) {
        message.value = "Ingresá un código válido";
        error.value = true;
        return;
    }
    loading.value = true;
    try {
        const email = route.query.email as string;
        if (!email) {
            throw new Error('Email no encontrado');
        }
        await securityStore.verify(code.value, email);
        message.value = "Verificación exitosa. Redirigiendo al login...";
        error.value = false;
        setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
        message.value = securityStore.error || "Error al verificar el código";
        error.value = true;
    } finally {
        loading.value = false;
    }
}

async function resendCode() {
    loading.value = true;
    try {
        const email = route.query.email as string;
        if (!email) {
            throw new Error('Email no encontrado');
        }
        await securityStore.resendVerification(email);
        message.value = "Código reenviado. Revisá tu correo.";
        error.value = false;
    } catch (e: any) {
        message.value = securityStore.error || "Error al reenviar el código";
        error.value = true;
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.login-bg {
    background: var(--background);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-bg-card {
    background: var(--card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
}

.login-title {
    color: var(--primary);
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: 1px;
}

.login-subtitle {
    color: var(--muted-text);
    font-size: 1.1rem;
    font-weight: 400;
}

.confirmation-title {
    color: var(--text);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.confirmation-subtitle {
    color: var(--muted-text);
    font-size: 1.1rem;
    font-weight: 400;
}

.login-btn {
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    height: 50px;
    width: 100%;
    align-self: stretch;
}

.login-link {
    color: var(--primary);
    font-weight: 500;
    margin-left: 4px;
    text-decoration: none;
}

.login-link:hover {
    text-decoration: underline;
}
</style>
