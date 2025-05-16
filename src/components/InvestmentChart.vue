<template>
    <div class="dashboard-invest-chart" style="position: relative">
        <svg
            :width="size"
            :height="size"
            :viewBox="`0 0 36 36`"
            style="z-index: 1"
        >
            <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="3"
            />
            <template v-for="(slice, idx) in slices" :key="slice.type">
                <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    :stroke="slice.color"
                    stroke-width="3"
                    :stroke-dasharray="
                        slice.percent + ' ' + (100 - slice.percent)
                    "
                    :stroke-dashoffset="slice.offset"
                    @mousemove="showTooltip($event, slice)"
                    @mouseleave="hideTooltip"
                    style="cursor: pointer"
                />
            </template>
        </svg>
        <div
            v-if="tooltip.show"
            class="dashboard-invest-tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
            <strong>{{ tooltip.label }}</strong
            ><br />
            {{ formatPercent(tooltip.percent) }}<br />
            {{ formatMoney(tooltip.value) }}
        </div>
        <div class="dashboard-invest-legend">
            <div v-for="slice in slices" :key="slice.type">
                <span
                    class="legend-dot"
                    :style="{ background: slice.color }"
                ></span>
                {{ formatPercent(slice.percent) }} - {{ slice.label }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    slices: Array<{
        type: string;
        color: string;
        label: string;
        value: number;
        percent: number;
        offset: number;
    }>;
    size?: number;
}>();

const size = props.size || 160;

const tooltip = ref({
    show: false,
    x: 0,
    y: 0,
    label: "",
    percent: 0,
    value: 0,
});
function showTooltip(e: MouseEvent, slice: any) {
    tooltip.value = {
        show: true,
        x: e.offsetX + 10,
        y: e.offsetY - 10,
        label: slice.label,
        percent: slice.percent,
        value: slice.value,
    };
}
function hideTooltip() {
    tooltip.value.show = false;
}

function formatMoney(value: number) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
function formatPercent(value: number) {
    return (
        value.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + "%"
    );
}
</script>

<style scoped>
.dashboard-invest-chart {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-top: 1rem;
}
.dashboard-invest-legend {
    font-size: 0.95rem;
    color: var(--muted-text);
}
.legend-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 6px;
}
.dashboard-invest-tooltip {
    position: absolute;
    background: #fff;
    color: #222;
    border-radius: 8px;
    box-shadow: 0 2px 8px 0 rgba(60, 60, 60, 0.12);
    padding: 8px 14px;
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 10;
    min-width: 120px;
    text-align: center;
}
</style>
