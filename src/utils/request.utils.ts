import { getOrderKeyword } from "../utils/Utils";
import { SortData } from "../services/ProductService";

interface ISearchPropsParams {
  search: string;
  sorterBy: string;
  order: string;
  limit: number;
  offset: number;
}

interface ISearchProps {
  sort: SortData;
  pagination: Record<string, number>;
}

export function getSearchProps(reqParams: ISearchPropsParams): ISearchProps {
  const orderKeyword = getOrderKeyword(reqParams.order);
  const sort: SortData = {
    sortBy: reqParams.sorterBy,
    order: orderKeyword,
  };
  const pagination = {
    limit: reqParams.limit || 8,
    offset: reqParams.offset || 0,
  };

  return {
    sort,
    pagination,
  };
}
