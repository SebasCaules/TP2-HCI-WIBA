<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="400px">
        <v-card class="error-dialog rounded-xl">
            <div class="error-dialog-header">
                <v-btn
                    icon
                    class="dialog-close-btn"
                    @click="$emit('update:modelValue', false)"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <div class="error-dialog-content">
                <v-icon color="error" size="48">mdi-alert-circle</v-icon>
                <div class="error-dialog-title">
                    {{ title }}
                </div>
                <div class="error-dialog-message">
                    {{ message }}
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">

const props = defineProps<{
    modelValue: boolean;
    title?: string;
    message: string;
}>();

defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<style scoped>
.error-dialog {
    border-radius: 2rem;
    padding: 1.5rem;
    text-align: center;
}

.error-dialog-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.dialog-close-btn {
    color: var(--muted-text) !important;
    margin-right: -8px;
}

.error-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    padding: 0 1rem 1rem;
}

.error-dialog-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary);
    margin-top: 0.5rem;
}

.error-dialog-message {
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 1rem;
}
</style> 