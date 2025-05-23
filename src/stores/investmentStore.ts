import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { investmentApi, type Investment, type PaginatedResponse, type FundDailyReturn } from '@/api/investment';
import { useAccountStore } from '@/stores/accountStore';

const VIRTUAL_FUNDS = [
    { id: 'growth', name: 'Fondo Growth' },
    { id: 'tech', name: 'Fondo Tech' },
    { id: 'value', name: 'Fondo Value' },
    { id: 'crypto', name: 'Fondo Crypto' },
    { id: 'realestate', name: 'Fondo Real Estate' }
];

function generateSymmetricCoefficient(): number {
    const sign = Math.random() < 0.4 ? -1 : 1;
    const magnitude = Math.random() * 1000; // entre 0 y 1
    return sign * magnitude;
}

export const useInvestmentStore = defineStore('investment', () => {
    // State
    const investment = ref<Investment | null>(null);
    const dailyRate = ref<number>(0);
    const dailyReturns = ref<FundDailyReturn[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const pagination = ref({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const accountStore = useAccountStore();

    // Getters
    const currentInvestment = computed(() => {
        if (!accountStore.account) return null;
        
        return {
            id: 1,
            userId: accountStore.account.id.toString(),
            amount: accountStore.account.invested,
            dailyRate: dailyRate.value,
            lastUpdated: new Date().toISOString(),
            totalReturns: 0 // This will be calculated when we have the daily returns
        };
    });

    const currentDailyRate = computed(() => dailyRate.value);
    const formattedDailyRate = computed(() => {
        return (dailyRate.value * 100).toFixed(4) + '%';
    });

    const totalReturns = computed(() => {
        if (!accountStore.account) return 0;
        // Calculate total returns based on adjusted returns
        const totalAdjustedReturn = dailyReturns.value.reduce((sum, fund) => sum + fund.adjusted_return, 0);
        return accountStore.account.invested * totalAdjustedReturn / 100;
    });

    const formattedTotalReturns = computed(() => {
        return totalReturns.value.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    });


    const adjustedReturns = computed(() => {
        if (!accountStore.account) return 0;
        // Calculate total returns based on adjusted returns
        return dailyReturns.value.reduce((sum, fund) => sum + fund.adjusted_return, 0);
    });

    // Calculate invested amount per fund
    const investedPerFund = computed(() => {
        if (!accountStore.account) return 0;
        return accountStore.account.invested / 5; // Divide total investment among 5 funds
    });

    // Actions
    const fetchDailyRate = async () => {
        try {
            isLoading.value = true;
            error.value = null;
            const rate = await investmentApi.getDailyRate();
            if (typeof rate !== 'number' || isNaN(rate)) {
                throw new Error('Invalid daily rate received from server');
            }
            dailyRate.value = rate;
        } catch (e: any) {
            console.error('Error fetching daily rate:', e);
            error.value = e.message || 'Error al obtener la tasa diaria';
            dailyRate.value = 0;
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const fetchDailyReturns = async (page = 1, pageSize = 10) => {
        try {
            isLoading.value = true;
            error.value = null;
            
            // Generate virtual fund returns
            const today = new Date().toISOString().split('T')[0];
            const fundReturns: FundDailyReturn[] = VIRTUAL_FUNDS.map(fund => {
                const coefficient = generateSymmetricCoefficient();
                return {
                    fund_id: fund.id,
                    fund_name: fund.name,
                    date: today,
                    base_return: dailyRate.value,
                    coefficient: coefficient,
                    adjusted_return: dailyRate.value * coefficient * 100
                };
            });

            dailyReturns.value = fundReturns;
            pagination.value = {
                page: 1,
                pageSize: fundReturns.length,
                total: fundReturns.length,
                totalPages: 1
            };
        } catch (e: any) {
            console.error('Error fetching daily returns:', e);
            error.value = e.message || 'Error al obtener los retornos diarios';
            dailyReturns.value = [];
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const invest = async (amount: number) => {
        try {
            isLoading.value = true;
            error.value = null;
            await investmentApi.invest(amount);
            await accountStore.fetchAccount();
            return currentInvestment.value;
        } catch (e: any) {
            error.value = e.message || 'Error al realizar la inversión';
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const divest = async (amount: number) => {
        try {
            isLoading.value = true;
            error.value = null;
            await investmentApi.divest(amount);
            await accountStore.fetchAccount();
            return currentInvestment.value;
        } catch (e: any) {
            error.value = e.message || 'Error al realizar el retiro';
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        // State
        investment,
        dailyRate,
        dailyReturns,
        isLoading,
        error,
        pagination,

        // Getters
        currentInvestment,
        currentDailyRate,
        formattedDailyRate,
        totalReturns,
        formattedTotalReturns,
        adjustedReturns,
        investedPerFund,

        // Actions
        fetchDailyRate,
        fetchDailyReturns,
        invest,
        divest
    };
}); 