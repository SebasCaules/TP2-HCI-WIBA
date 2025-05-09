import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                dark: false,
                colors: {
                    background: 'var(--background)',
                    primary: 'var(--primary)',
                    accent: 'var(--accent)',
                    success: 'var(--success)',
                    error: 'var(--error)',
                    'on-primary': 'var(--primary-foreground)',
                    'on-accent': 'var(--accent-foreground)',
                    'on-background': 'var(--foreground)',
                    'on-surface': 'var(--foreground)',
                    'on-error': '#ffffff',
                    'on-success': '#ffffff',
                    surface: 'var(--background)',
                    'surface-variant': 'var(--background)',
                    'surface-bright': 'var(--background)',
                    'surface-light': 'var(--background)',
                    'surface-dark': 'var(--background)',
                    'surface-container': 'var(--background)',
                    'surface-container-low': 'var(--background)',
                    'surface-container-high': 'var(--background)',
                    'surface-container-highest': 'var(--background)',
                }
            }
        }
    }
})

export default vuetify 