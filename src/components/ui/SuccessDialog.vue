<template>
    <v-dialog v-model="dialog" max-width="400px">
        <v-card class="success-dialog rounded-xl">
            <div class="success-dialog-header">
                <v-btn icon class="dialog-close-btn" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <div class="success-dialog-content">
                <v-icon color="success" size="48">mdi-check-circle</v-icon>
                <div class="success-dialog-title">{{ title }}</div>
                <div class="success-dialog-message">{{ message }}</div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

function closeDialog() {
    dialog.value = false;
}
</script>

<style scoped>
.success-dialog {
    border-radius: 1.5rem;
    padding: 1.5rem;
    text-align: center;
}

.success-dialog-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
}

.success-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 1rem;
}

.success-dialog-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary);
    margin-top: 0.5rem;
}

.success-dialog-message {
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 1rem;
}
</style> 