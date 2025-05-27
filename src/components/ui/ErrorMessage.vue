<template>
    <div v-if="message" class="error-message">
        {{ message }}
    </div>
</template>

<script setup lang="ts">
defineProps<{
    message: string;
}>();
</script>

<style scoped>
.error-message {
    color: var(--error);
    font-size: 1.02rem;
    margin-top: 0.7rem;
    margin-bottom: 0.5rem;
    text-align: center;
    font-family: var(--font-sans, sans-serif);
}
</style> 