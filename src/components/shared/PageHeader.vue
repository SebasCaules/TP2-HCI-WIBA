<template>
    <div class="page-header">
        <h1 class="page-title">{{ title }}</h1>
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
}>();
</script>

<style scoped>
.page-header {
    margin-bottom: 24px;
}

.page-title {
    
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    font-family: var(--font-sans), sans-serif;
}
</style> 