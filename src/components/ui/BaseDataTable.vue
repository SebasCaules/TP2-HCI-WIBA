<template>
    <div>
        <v-data-table
            :items="paginatedItems"
            :headers="headers"
            :loading="loading"
            :items-per-page="itemsPerPageLocal"
            :item-value="itemKey"
            :hover="rowClickable"
            class="base-data-table"
            @click:row="handleRowClick"
        >
            <!-- Custom header slots -->
            <template
                v-for="header in headers"
                :key="header.key"
                #[`header.${header.key}`]
            >
                <th
                    :class="[
                        'table-header',
                        header.align ? `text-${header.align}` : '',
                        header.class || '',
                    ]"
                    :style="header.width ? { width: header.width } : {}"
                >
                    {{ header.title }}
                </th>
            </template>

            <!-- Custom item slots -->
            <template
                v-for="header in headers"
                :key="header.key"
                #[`item.${header.key}`]="{ item }"
            >
                <td
                    :class="[
                        'table-cell',
                        header.align ? `text-${header.align}` : '',
                        header.class || '',
                    ]"
                    :style="header.width ? { width: header.width } : {}"
                >
                    <slot :name="`item.${header.key}`" :item="item">
                        {{ item[header.key] }}
                    </slot>
                </td>
            </template>

            <!-- No data template -->
            <template #no-data>
                <div class="no-data-container">
                    <v-icon
                        v-if="emptyIcon"
                        :icon="emptyIcon"
                        size="large"
                        color="grey"
                        class="mb-2"
                    />
                    <div class="text-h6 text-grey">{{ noDataMessage }}</div>
                    <slot name="no-data-content" />
                </div>
            </template>

            <!-- Pagination and items per page selector -->
            <template #bottom>
                <!-- Removed pagination and items per page selector as requested -->
            </template>
        </v-data-table>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

interface Header {
    title: string;
    key: string;
    align?: "start" | "center" | "end";
    sortable?: boolean;
    class?: string;
    width?: string;
}

interface Props {
    items: any[];
    headers: Header[];
    loading?: boolean;
    itemKey?: string;
    itemsPerPage?: number;
    pagination?: boolean;
    rowClickable?: boolean;
    noDataMessage?: string;
    emptyIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    itemKey: "id",
    itemsPerPage: 10,
    pagination: false,
    rowClickable: false,
    noDataMessage: "No hay datos disponibles",
    emptyIcon: "mdi-database-off",
});

const emit = defineEmits<{
    (e: "rowClick", item: any): void;
}>();

const currentPage = ref(1);
const itemsPerPageOptions = [5, 10, 20, 50];
const itemsPerPageLocal = ref(props.itemsPerPage);

watch(
    () => props.itemsPerPage,
    (val) => {
        itemsPerPageLocal.value = val;
    }
);

watch(itemsPerPageLocal, () => {
    currentPage.value = 1;
});

const pageCount = computed(() =>
    Math.ceil(props.items.length / itemsPerPageLocal.value)
);

const paginatedItems = computed(() => {
    if (!props.pagination && !pageCount.value) return props.items;
    const start = (currentPage.value - 1) * itemsPerPageLocal.value;
    return props.items.slice(start, start + itemsPerPageLocal.value);
});

const handleRowClick = (item: any) => {
    if (props.rowClickable) {
        emit("rowClick", item);
    }
};
</script>

<style scoped>
.table-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 0.5rem;
}

.base-data-table {
    background: transparent;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    width: 100%;
    overflow-x: auto;
    --v-table-row-height: 70px;
}

.base-data-table :deep(th),
.base-data-table :deep(td) {
    padding: 0 16px !important;
    white-space: nowrap;
}

.base-data-table :deep(th) {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text);
    background-color: var(--card);
    border-bottom: none;
    font-family: var(--font-sans), sans-serif;
    position: sticky;
    top: 0;
    z-index: 1;
    height: var(--v-table-row-height) !important;
}

.base-data-table :deep(tbody tr) {
    transition: background 0.18s;
    border-bottom: 1px solid var(--border);
    height: var(--v-table-row-height) !important;
}

.base-data-table :deep(tbody td) {
    font-size: 0.95rem;
    color: var(--text);
    border-bottom: none;
    vertical-align: middle;
    height: var(--v-table-row-height) !important;
}

/* Intercalado de filas */
.base-data-table :deep(tbody tr:nth-child(even)) {
    background-color: var(--surface-alt) !important;
}

/* Centrado de contenido */
.text-center {
    text-align: center !important;
}

.text-start {
    text-align: start !important;
}

.text-end {
    text-align: end !important;
}

/* Contenedor de no data */
.no-data-container {
    padding: 1.5rem;
    text-align: center;
    color: var(--muted-text);
}

.no-data-container .v-icon {
    margin-bottom: 0.75rem;
}

/* Paginación */
.v-pagination {
    margin-top: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 960px) {
    .base-data-table :deep(th),
    .base-data-table :deep(td) {
        padding: 0 12px !important;
        font-size: 0.9rem;
    }

    .base-data-table {
        --v-table-row-height: 40px;
    }

    /* Hide less important columns on tablet */
    .base-data-table :deep(th[data-priority="low"]),
    .base-data-table :deep(td[data-priority="low"]) {
        display: none;
    }
}

@media (max-width: 600px) {
    .base-data-table :deep(th),
    .base-data-table :deep(td) {
        padding: 6px 8px !important;
        font-size: 0.85rem;
    }

    /* Hide medium priority columns on mobile */
    .base-data-table :deep(th[data-priority="medium"]),
    .base-data-table :deep(td[data-priority="medium"]) {
        display: none;
    }

    /* Ensure logo column is always visible on mobile */
    .base-data-table :deep(th[data-priority="high"]),
    .base-data-table :deep(td[data-priority="high"]) {
        display: table-cell !important;
    }
}

.pagination-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding: 0 1rem;
}

.items-per-page-selector {
    background-color: var(--surface);
    border-radius: 999px;
    min-width: 100px;
    max-width: 140px;
    font-size: 0.875rem;
    padding: 4px 12px;
}

.base-data-table :deep(tbody) {
    min-height: 480px; /* 10 rows x 48px row height */
    display: table-row-group;
}
</style>
