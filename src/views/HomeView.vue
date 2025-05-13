<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">WIBA</h1>
          <h2 class="hero-subtitle">Tu billetera virtual</h2>
          <p class="hero-description">
            Gestioná tus finanzas de manera simple y segura. Transferí dinero, invertí y administrá tus tarjetas en un solo lugar.
          </p>
          <div class="hero-cta">
            <FilledButton class="hero-cta-btn" to="/register">
              Crear cuenta
            </FilledButton>
            <FilledButton class="hero-cta-btn secondary" to="/login">
              Iniciar sesión
            </FilledButton>
          </div>
        </div>
        <div class="hero-image">
          <img src="@/assets/hero-illustration.svg" alt="WIBA Wallet Illustration" class="hero-illustration" />
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <div class="features-content">
        <div class="feature-card">
          <v-icon size="48" color="var(--primary)" class="feature-icon">mdi-swap-horizontal</v-icon>
          <h3 class="feature-title">Transferencias instantáneas</h3>
          <p class="feature-description">Enviá dinero a cualquier persona de forma rápida y segura.</p>
        </div>
        <div class="feature-card">
          <v-icon size="48" color="var(--primary)" class="feature-icon">mdi-credit-card-multiple</v-icon>
          <h3 class="feature-title">Gestión de tarjetas</h3>
          <p class="feature-description">Administrá todas tus tarjetas en un solo lugar.</p>
        </div>
        <div class="feature-card">
          <v-icon size="48" color="var(--primary)" class="feature-icon">mdi-chart-line</v-icon>
          <h3 class="feature-title">Inversiones inteligentes</h3>
          <p class="feature-description">Hacé crecer tu dinero con nuestras opciones de inversión.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilledButton from '@/components/ui/FilledButton.vue'
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--background);
}

/* Hero Section */
.hero-section {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, var(--primary) 0%, #2c7873 100%);
  color: white;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
}

.hero-text {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  opacity: 0.95;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-cta {
  display: flex;
  gap: 1rem;
}

.hero-cta-btn {
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.8rem 2rem;
  background: white !important;
  color: var(--primary) !important;
}

.hero-cta-btn.secondary {
  background: transparent !important;
  color: white !important;
  border: 2px solid white !important;
}

.hero-cta-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-illustration {
  max-width: 100%;
  height: auto;
  max-height: 400px;
}

/* Features Section */
.features-section {
  padding: 4rem 2rem;
  background: var(--card);
}

.features-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.8rem;
}

.feature-description {
  color: var(--muted-text);
  font-size: 1.1rem;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 960px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .hero-text {
    max-width: 100%;
  }

  .hero-cta {
    justify-content: center;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.8rem;
  }

  .features-content {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 3rem 1rem;
  }

  .features-section {
    padding: 3rem 1rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-cta {
    flex-direction: column;
  }

  .hero-cta-btn {
    width: 100%;
  }
}
</style> 