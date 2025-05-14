<template>
    <v-container fluid class="reset-password-container">
        <div class="reset-password-content">
            <h1 class="reset-password-title">Restablecer Contraseña</h1>

            <div v-if="error" class="reset-password-error">
                {{ error }}
            </div>

            <div v-if="resetSuccess" class="reset-password-success">
                Contraseña actualizada exitosamente. Serás redirigido al inicio
                de sesión...
            </div>

            <v-form
                v-if="!resetSuccess"
                @submit.prevent="handleSubmit"
                class="reset-password-form"
            >
                <CustomTextField
                    v-model="password"
                    type="password"
                    placeholder="Nueva contraseña"
                    :rules="passwordRules"
                    class="reset-password-input"
                />

                <CustomTextField
                    v-model="confirmPassword"
                    type="password"
                    placeholder="Confirmar contraseña"
                    :rules="confirmPasswordRules"
                    class="reset-password-input"
                />

                <FilledButton
                    type="submit"
                    class="reset-password-submit"
                    :loading="loading"
                    :disabled="!isFormValid"
                >
                    Actualizar Contraseña
                </FilledButton>
            </v-form>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authService } from "@/services/auth";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";

const route = useRoute();
const router = useRouter();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const resetSuccess = ref(false);

// Check for token before component mount
const accessToken = ref<string | null>(null);

onBeforeMount(() => {
    // Get token from URL query parameters before Supabase consumes it
    const token = window.location.search.split('access_token=')[1]?.split('&')[0];
    if (!token) {
        error.value = "Token de acceso no válido. Por favor, solicita un nuevo enlace de restablecimiento de contraseña.";
        return;
    }
    accessToken.value = token;
});

const passwordRules = [
    (v: string) => !!v || "La contraseña es requerida",
    (v: string) =>
        v.length >= 6 || "La contraseña debe tener al menos 6 caracteres",
];

const confirmPasswordRules = [
    (v: string) => !!v || "La confirmación de contraseña es requerida",
    (v: string) => v === password.value || "Las contraseñas no coinciden",
];

const isFormValid = computed(() => {
    return (
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        password.value.length >= 6
    );
});

const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!accessToken.value) {
        error.value = "Token de acceso no válido. Por favor, solicita un nuevo enlace de restablecimiento de contraseña.";
        return;
    }

    loading.value = true;
    try {
        const { success, error: resetError } = await authService.resetPasswordWithToken(accessToken.value, password.value);

        if (success) {
            resetSuccess.value = true;
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } else {
            error.value = resetError || "Error al restablecer la contraseña";
        }
    } catch (err) {
        error.value = "Error al restablecer la contraseña";
    } finally {
        loading.value = false;
    }
};

const validateForm = () => {
    if (!isFormValid.value) {
        error.value = "Por favor, completa todos los campos correctamente.";
        return false;
    }
    return true;
};
</script>

<style scoped>
.reset-password-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
}

.reset-password-content {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background: var(--card);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
}

.reset-password-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--text);
    font-family: var(--font-sans), sans-serif;
}

.reset-password-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.reset-password-input {
    width: 100%;
}

.reset-password-submit {
    margin-top: 1rem;
    width: 100%;
}

.reset-password-error {
    background: var(--error);
    color: white;
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    text-align: center;
}

.reset-password-success {
    background: var(--success);
    color: white;
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    text-align: center;
}
</style>
