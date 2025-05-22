import { ref } from "vue";
import { defineStore } from "pinia";
import { CardsApi, type Card, type CreateCardRequest } from "@/api/cards";
import { Api } from "@/api/Api";

export const useCardsStore = defineStore("cards", () => {
    const cards = ref<Card[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchCards(): Promise<void> {
        console.log('Fetching cards...');
        console.log('Current API token:', Api.token);
        isLoading.value = true;
        error.value = null;
        try {
            console.log('Making API call to get cards...');
            const fetchedCards = await CardsApi.getCards();
            console.log('Raw API response:', fetchedCards);
            
            // Validate response
            if (!fetchedCards) {
                console.error('API returned null or undefined');
                throw new Error('Invalid response from server');
            }
            
            if (!Array.isArray(fetchedCards)) {
                console.error('API response is not an array:', fetchedCards);
                throw new Error('Invalid response format from server');
            }

            // Validate each card has required fields
            const validCards = fetchedCards.filter(card => {
                const isValid = card && 
                    typeof card.number === 'string' && 
                    typeof card.expirationDate === 'string';
                if (!isValid) {
                    console.error('Invalid card data:', card);
                }
                return isValid;
            });

            console.log('Validated cards:', validCards);
            cards.value = validCards;
        } catch (err) {
            console.error('Error in fetchCards:', err);
            error.value = err instanceof Error ? err.message : "Error fetching cards";
            cards.value = []; // Reset cards on error
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function addCard(cardData: CreateCardRequest): Promise<Card> {
        isLoading.value = true;
        error.value = null;
        try {
            const newCard = await CardsApi.createCard(cardData);
            cards.value = [newCard, ...cards.value];
            return newCard;
        } catch (err) {
            error.value = err instanceof Error ? err.message : "Error adding card";
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function removeCard(cardId: number): Promise<void> {
        isLoading.value = true;
        error.value = null;
        try {
            await CardsApi.deleteCard(cardId);
            cards.value = cards.value.filter(card => card.id !== cardId);
        } catch (err) {
            error.value = err instanceof Error ? err.message : "Error removing card";
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        cards,
        isLoading,
        error,
        fetchCards,
        addCard,
        removeCard,
    };
}); 