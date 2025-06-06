<template>
    <v-container fluid class="reset-password-container d-flex align-center justify-center">
        <div class="reset-password-content mx-auto">
            <h1 class="reset-password-title">Restablecer Contraseña</h1>

            <div v-if="error" class="reset-password-error">
                {{ error }}
            </div>

            <div v-if="resetSuccess" class="reset-password-success">
                Contraseña actualizada exitosamente. Serás redirigido al inicio
                de sesión...
            </div>

            <v-form
                v-if="!resetSuccess && !error"
                @submit.prevent="handleSubmit"
                class="reset-password-form"
            >
                <CustomTextField
                    v-model="verificationCode"
                    placeholder="Código de verificación"
                    :rules="verificationCodeRules"
                    class="reset-password-input"
                />

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

            <div v-if="error" class="reset-password-actions">
                <router-link to="/login" class="reset-password-link">
                    Volver al inicio de sesión
                </router-link>
            </div>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import CustomTextField from "@/components/ui/CustomTextField.vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import { useSecurityStore } from "@/stores/securityStore.ts";

interface PasswordRules {
    (v: string): boolean | string;
}

const router = useRouter();
const securityStore = useSecurityStore();

const verificationCode = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const resetSuccess = ref(false);

const verificationCodeRules: PasswordRules[] = [
    (v: string) => !!v || "El código de verificación es requerido",
];

const passwordRules: PasswordRules[] = [
    (v: string) => !!v || "La contraseña es requerida",
    (v: string) =>
        v.length >= 6 || "La contraseña debe tener al menos 6 caracteres",
];

const confirmPasswordRules: PasswordRules[] = [
    (v: string) => !!v || "La confirmación de contraseña es requerida",
    (v: string) => v === password.value || "Las contraseñas no coinciden",
];

const isFormValid = computed(() => {
    return (
        verificationCode.value &&
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        password.value.length >= 6
    );
});

const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        await securityStore.confirmPasswordChange(verificationCode.value, password.value);
        resetSuccess.value = true;
        setTimeout(() => {
            router.push('/login');
        }, 3000);
    } catch (err: any) {
        error.value = securityStore.error || "Error al restablecer la contraseña. Por favor, intenta nuevamente.";
    } finally {
        loading.value = false;
    }
};

const validateForm = (): boolean => {
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
    box-shadow: var(--shadow-card);
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

.reset-password-actions {
    margin-top: 1rem;
    text-align: center;
}

.reset-password-link {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
}

.reset-password-link:hover {
    text-decoration: underline;
}
</style>
