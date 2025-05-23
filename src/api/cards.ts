import { Api, type ApiResponse } from "./api";

export interface Card {
  id: number;
  type: 'CREDIT' | 'DEBIT';
  number: string;
  expirationDate: string;
  fullName: string;
  metadata: Record<string, any>;
}

export interface CreateCardRequest {
  type: 'CREDIT' | 'DEBIT';
  number: string;
  expirationDate: string;
  fullName: string;
  cvv: string;
  metadata?: Record<string, any>;
}

export interface CardsResponse {
  cards: Card[];
}

export class CardsApi {
  static getUrl(slug?: string): string {
    return `${Api.baseUrl}/card${slug ? `/${slug}` : ""}`;
  }

  static async getCards(controller?: AbortController): Promise<Card[]> {

    const response = await Api.get(CardsApi.getUrl(), true, controller);

    
    // Handle both response formats:
    // 1. Direct array of cards: [{...}, {...}]
    // 2. Object with cards property: { cards: [{...}, {...}] }
    let cards: Card[];
    
    if (Array.isArray(response)) {

      cards = response;
    } else if (response && typeof response === 'object' && Array.isArray(response.cards)) {

      cards = response.cards;
    } else {
      console.error('Invalid API response format:', response);
      throw new Error('Invalid response format from server');
    }

    // Validate each card has required fields
    const validCards = cards.filter(card => {
      const isValid = card && 
        typeof card.number === 'string' && 
        typeof card.expirationDate === 'string' &&
        typeof card.type === 'string' &&
        (card.type === 'CREDIT' || card.type === 'DEBIT');
      
      if (!isValid) {
        console.error('Invalid card data:', card);
      }
      return isValid;
    });


    return validCards;
  }

  static async getCard(id: number, controller?: AbortController): Promise<Card> {
    return await Api.get(CardsApi.getUrl(id.toString()), true, controller) as Card;
  }

  static async createCard(cardData: CreateCardRequest, controller?: AbortController): Promise<Card> {
    return await Api.post(CardsApi.getUrl(), true, cardData, controller) as Card;
  }

  static async deleteCard(id: number, controller?: AbortController): Promise<void> {
    await Api.delete(CardsApi.getUrl(id.toString()), true, controller);
  }
} 