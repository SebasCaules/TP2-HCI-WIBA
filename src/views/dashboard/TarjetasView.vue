<template>
  <v-container>
    <h1 class="tarjetas-title">Tarjetas</h1>
    <v-btn color="primary" class="tarjetas-add-btn" rounded prepend-icon="mdi-plus">
      Agregar
    </v-btn>
    <v-divider class="mb-4" />
    <v-table class="tarjetas-table" density="comfortable">
      <tbody>
        <tr v-for="card in cards" :key="card.id" class="tarjeta-row">
          <td class="tarjeta-logo-cell">
            <img :src="card.logo" :alt="card.brand" class="tarjeta-logo" />
          </td>
          <td class="tarjeta-name-cell">
            <span class="tarjeta-name">{{ card.name }}</span>
          </td>
          <td class="tarjeta-expiry-cell">
            <span class="tarjeta-expiry">Vence {{ card.expiry }}</span>
          </td>
          <td class="tarjeta-delete-cell">
            <v-btn variant="text" color="error" class="tarjeta-delete-btn" @click="deleteCard(card.id)">
              Eliminar
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cards = ref([
  {
    id: 1,
    brand: 'Mastercard',
    name: 'Mastercard Débito *5920',
    expiry: '03/28',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png',
  },
  {
    id: 2,
    brand: 'Visa',
    name: 'Visa Crédito *3713',
    expiry: '07/29',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png',
  },
  {
    id: 3,
    brand: 'Amex',
    name: 'American Express *2712',
    expiry: '04/27',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg',
  },
])

function deleteCard(id: number) {
  cards.value = cards.value.filter(card => card.id !== id)
}
</script>

<style scoped>
.tarjetas-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
}
.tarjetas-add-btn {
  margin-bottom: 2.2rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.7rem 2.5rem;
}
.tarjetas-table {
  width: 100%;
  background: transparent;
  border-collapse: separate;
  border-spacing: 0 0.5rem;
}
.tarjeta-row {
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
}
.tarjeta-logo-cell {
  width: 60px;
  padding: 0.7rem 0.5rem 0.7rem 0.2rem;
}
.tarjeta-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
}
.tarjeta-name-cell {
  font-weight: 700;
  font-size: 1.1rem;
  padding-left: 0.5rem;
}
.tarjeta-expiry-cell {
  color: #888;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: right;
  padding-right: 2.5rem;
}
.tarjeta-delete-cell {
  text-align: right;
  width: 120px;
}
.tarjeta-delete-btn {
  color: #e53935 !important;
  font-weight: 700;
  font-size: 1.1rem;
}
</style> 