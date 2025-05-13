<template>
    <v-app>
        <Topbar />
        <v-main>
            <div class="dashboard-layout">
                <Sidebar />
                <div class="dashboard-content">
                    <router-view />
                </div>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";
import Sidebar from '@/components/shared/Sidebar.vue'
import Topbar from '@/components/shared/Topbar.vue'

        const authStore = useAuthStore();
        const router = useRouter();

        const logout = () => {
    authStore.clearUser();
    router.push("/login");
        };
</script>

<style scoped>
.dashboard-layout {
    display: flex;
    min-height: 100vh;
}
.dashboard-content {
    flex: 1;
    padding: 2rem;
    background: var(--background);
}
</style>
