import { createRouter, createWebHistory } from 'vue-router'
import { useSecurityStore } from '@/stores/securityStore'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeView.vue')
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/auth/LoginView.vue')
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/auth/RegisterView.vue')
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: () => import('@/views/auth/ResetPasswordView.vue')
        },
        {
            path: '/confirmacion',
            name: 'confirmacion',
            component: () => import('@/views/auth/ConfirmationView.vue')
        },
        {
            path: '/dashboard',
            component: () => import('@/layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/DashboardView.vue')
                },
                {
                    path: 'transacciones',
                    name: 'transacciones',
                    component: () => import('@/views/dashboard/TransaccionesView.vue')
                },
                {
                    path: 'tarjetas',
                    name: 'tarjetas',
                    component: () => import('@/views/dashboard/TarjetasView.vue')
                },
                {
                    path: 'inversiones',
                    name: 'inversiones',
                    component: () => import('@/views/dashboard/InversionesView.vue')
                },
                {
                    path: 'depositar',
                    name: 'depositar',
                    component: () => import('@/views/dashboard/DepositarView.vue')
                },
                {
                    path: 'transferir',
                    name: 'transferir',
                    component: () => import('@/views/dashboard/TransferirView.vue')
                },
                {
                    path: 'configuracion',
                    name: 'configuracion',
                    component: () => import('@/views/dashboard/SettingsView.vue')
                },
                {
                    path: 'pagos',
                    name: 'pagos',
                    component: () => import('@/views/dashboard/PagosView.vue')
                },
                {
                    path: 'contactos',
                    name: 'contactos',
                    component: () => import('@/views/dashboard/ContactsView.vue')
                }
            ]
        }
    ]
})

// Navigation guard for protected routes
router.beforeEach((to, _from, next) => {
    const securityStore = useSecurityStore()

    if (to.meta.requiresAuth && !securityStore.isLoggedIn) {
        next('/login')
    } else {
        next()
    }
})

export default router