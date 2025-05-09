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

<script lang="ts">
import { defineComponent } from "vue";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";
import Sidebar from '@/components/shared/Sidebar.vue'
import Topbar from '@/components/shared/Topbar.vue'

export default defineComponent({
    name: "DashboardLayout",
    setup() {
        const authStore = useAuthStore();
        const router = useRouter();

        const logout = () => {
            authStore.logout();
            router.push("/profile/auth/login");
        };

        return {
            logout,
        };
    },
});
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
