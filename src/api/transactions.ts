import { Api } from '@/api/Api'

export interface FullTransaction {
    id: number;
    description: string;
    amount: number;
    pending: boolean;
    uuid: string;
    method: string;
    payer: {
      id: number;
      firstName: string;
      lastName: string;
    };
    receiver: {
      id: number;
      firstName: string;
      lastName: string;
    };
    card: {
      id: number;
      number: string;
    };
    metadata: Record<string, any>;
  }


export class TransactionApi {
    static getUrl(slug?: string): string {
        return `${Api.baseUrl}/payment${slug ? `/${slug}` : ""}`;
    }



    static async transferByIdentifier(identifier: string, type: "email" | "cvu" | "alias", cardId: string, amount: number, description: string): Promise<FullTransaction> {

        const url = `${TransactionApi.getUrl(`transfer-${type}`)}?${type}=${identifier}&cardId=${cardId}`

        const body = {
            description: description,
            amount: amount,
            metadata: {}
        }

        const response = await Api.post(url, true, body)

        if(response.status !== 200) {
            throw new Error(response.message)   // TODO: handle error for user experience
        }

        return response as FullTransaction
    }
    
    static async getAll(): Promise<FullTransaction[]> {    // temporary method
        const response = await Api.get(TransactionApi.getUrl(), true)
        return response as FullTransaction[]
    }

}
