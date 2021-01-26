import { Service } from "typedi";
import axios from "axios";

interface ICommonRef {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
}

interface ICommonReferencesParams {
  accreditationUmpire?: string;
  accreditationCoach?: string;
  ShopFulfilmentStatus?: string;
  ShopPaymentStatus?: string;
}

interface ICommonReferences {
  accreditationUmpire?: ICommonRef[];
  accreditationCoach?: ICommonRef[];
  ShopPaymentStatus?: ICommonRef[];
  ShopFulfilmentStatus?: ICommonRef[];
}

@Service()
export default class FetchService {
  public async fetchCommonReferences(
    references: ICommonReferencesParams,
    authToken: string
  ): Promise<ICommonReferences> {
    const url = process.env.COMMON_SERVICE_API_URL + "/common/references";

    try {
      const { data } = await axios.post(url, references, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          SourceSystem: "WebAdmin",
          Authorization: authToken
        },
      });

      return data;
    } catch (error) {
      throw error;
    }

  }
}
