<template>
    <v-dialog
        v-model="dialog"
        max-width="500px"
        :retain-focus="false"
        :scrim="true"
    >
        <v-card class="add-contact-dialog" width="100%">
            <div class="dialog-header-centered">
                <BackButton
                    v-if="showBack && backTo"
                    :to="backTo"
                    class="dialog-back-btn"
                    @click="onBack"
                />
                <span class="dialog-title-centered">¿Agregar este contacto?</span>
                <v-btn icon class="dialog-close-btn" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-card-text style="padding-bottom: 0">
                <div class="contact-main-info">
                    <div class="contact-avatar-large">{{ contact?.initials }}</div>
                    <div class="contact-main-name">
                        <span class="contact-main-fullname">{{ contact?.first_name }} {{ contact?.last_name }}</span>
                    </div>
                </div>
                <div class="contact-info-centered">
                    <div><strong>Usuario:</strong> {{ contact?.username }}</div>
                    <div><strong>Número de cuenta:</strong> {{ contact?.account_number }}</div>
                </div>
            </v-card-text>
            <v-card-actions class="dialog-actions-row">
                <FilledButton
                class="action-button secondary-btn"
                style="margin-left: 1rem;"
                @click="onBack"
                >No, volver atrás</FilledButton>
                <FilledButton
                    class="action-button"
                    color="primary"
                    @click="onConfirm"
                >Sí, agregar</FilledButton>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import FilledButton from "@/components/ui/FilledButton.vue";
import BackButton from "@/components/ui/BackButton.vue";
import type { Contact } from "@/types/types";

const props = defineProps<{
    modelValue: boolean;
    contact: Contact | null;
    showBack?: boolean;
    backTo?: string;
}>();
const emit = defineEmits(["confirm", "cancel", "update:modelValue", "back"]);

const dialog = ref(props.modelValue);

watch(
    () => props.modelValue,
    (newVal) => {
        dialog.value = newVal;
    }
);

watch(dialog, (newVal) => {
    emit("update:modelValue", newVal);
});

function closeDialog() {
    dialog.value = false;
    emit("cancel");
}

function onConfirm() {
    emit("confirm");
}

function onBack() {
    emit("back");
}
</script>

<style scoped>
.add-contact-dialog {
    padding: 2rem 3rem;
    border-radius: 2rem !important;
    overflow: visible;
    box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.1);
    width: 100%;
    margin: 0 auto;
}
.dialog-header-centered {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    position: relative;
}
.dialog-title-centered {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    flex: 1;
}
.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
    position: absolute;
    right: 0;
}
.dialog-back-btn {
    position: absolute;
    left: 0;
}
.contact-main-info {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.2rem;
    gap: 1.2rem;
}
.contact-avatar-large {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #444;
    font-size: 2rem;
    margin-right: 0.5rem;
}
.contact-main-name {
    display: flex;
    align-items: center;
}
.contact-main-fullname {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
}
.contact-info-centered {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}
.dialog-actions-row {
    padding: 0.5rem 0 1.5rem 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}
.action-button {
    min-width: 160px;
    max-width: 220px;
    width: 100%;
}
.secondary-btn {
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: none;
}
</style>
