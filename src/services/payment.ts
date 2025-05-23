// src/services/payment.ts
import { Api } from "@/api/Api";

export interface PaymentRequest {
  description: string;
  amount: number;
  metadata: Record<string, any>;
}

const BASE_URL = `${Api.baseUrl}/payment`;

export const PaymentApi = {
  pull(payload: PaymentRequest) {
    return Api.post(`${BASE_URL}/pull`, true, payload);
  },

  push(uuid: string, cardId?: string) {
    const query = new URLSearchParams({ uuid });
    if (cardId) query.append("cardId", cardId);
    return Api.put(`${BASE_URL}/push?${query.toString()}`, true, {});
  },

  transferByEmail(email: string, payload: PaymentRequest, cardId?: string) {
    const query = new URLSearchParams({ email });
    if (cardId) query.append("cardId", cardId);
    return Api.post(`${BASE_URL}/transfer-email?${query.toString()}`, true, payload);
  },

  transferByCVU(cvu: string, payload: PaymentRequest, cardId?: string) {
    const query = new URLSearchParams({ cvu });
    if (cardId) query.append("cardId", cardId);
    return Api.post(`${BASE_URL}/transfer-cvu?${query.toString()}`, true, payload);
  },

  transferByAlias(alias: string, payload: PaymentRequest, cardId?: string) {
    const query = new URLSearchParams({ alias });
    if (cardId) query.append("cardId", cardId);
    return Api.post(`${BASE_URL}/transfer-alias?${query.toString()}`, true, payload);
  },

  getAll(params: {
    page?: number;
    direction?: "ASC" | "DESC";
    pending?: boolean;
    method?: "ACCOUNT" | "CARD";
    range?: "THREE_DAYS" | "LAST_WEEK" | "LAST_MONTH";
    role?: "PAYER" | "RECEIVER";
    cardId?: number;
  } = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) query.append(key, String(value));
    }
    return Api.get(`${BASE_URL}?${query.toString()}`, true);
  },

  getOne(id: string | number) {
    return Api.get(`${BASE_URL}/${id}`, true);
  },
};