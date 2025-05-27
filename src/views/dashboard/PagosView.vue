<template>
    <v-container class="pagos-container" fluid>
        <div class="pagos-content">
            <PageHeader title="Pagos" />

            <div class="pagos-toggle-wrapper">
                <IconFilledButton
                    :icon="'mdi-cash-plus'"
                    :variant="activeTab === 'create' ? 'primary' : 'secondary'"
                    @click="activeTab = 'create'"
                >
                    Cobrar
                </IconFilledButton>
                <IconFilledButton
                    :icon="'mdi-cash-minus'"
                    :variant="activeTab === 'pay' ? 'primary' : 'secondary'"
                    @click="activeTab = 'pay'"
                >
                    Pagar
                </IconFilledButton>
            </div>

            <div class="pagos-section">
                <CreatePayment v-if="activeTab === 'create'" />
                <PayPayment v-if="activeTab === 'pay'" :initial-uuid="route.query.uuid as string" />
            </div>
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import CreatePayment from "@/components/payment/CreatePayment.vue";
import PayPayment from "@/components/payment/PayPayment.vue";
import PageHeader from "@/components/shared/PageHeader.vue";
import IconFilledButton from "@/components/ui/IconFilledButton.vue";

const route = useRoute();
const activeTab = ref('create');

onMounted(() => {
    const mode = route.query.mode;
    if (mode === 'pay') {
        activeTab.value = 'pay';
    } else if (mode === 'charge') {
        activeTab.value = 'create';
    } else if (route.query.uuid) {
        activeTab.value = 'pay';
    }
});
</script>

<style scoped>
.pagos-container {
    padding: 2rem;
    background-color: var(--background);
    min-height: 100vh;
    display: flex;
    justify-content: center;
}

.pagos-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pagos-toggle-wrapper {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.pagos-section {
    width: 100%;
    display: flex;
    justify-content: center;
}
</style>
