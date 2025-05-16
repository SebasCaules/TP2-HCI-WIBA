<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import { type Stock } from '@/services/investments'

const props = defineProps<{
  stock: Stock;
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const priceHistory = props.stock.price_history || []
  const labels = priceHistory.map(point => new Date(point.date).toLocaleDateString())
  const data = priceHistory.map(point => point.price)

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Precio',
        data,
        borderColor: '#5BA4B4',
        backgroundColor: 'rgba(91, 164, 180, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `$${value}`
          }
        }
      }
    }
  })
}

const updateChart = () => {
  if (!chart) return

  const priceHistory = props.stock.price_history || []
  const labels = priceHistory.map(point => new Date(point.date).toLocaleDateString())
  const data = priceHistory.map(point => point.price)

  chart.data.labels = labels
  chart.data.datasets[0].data = data
  chart.update()
}

watch(() => props.stock, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}
</style> 