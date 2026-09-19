// ---- Types ----
// One Product shape covers every DummyJSON category (beauty, mobile-accessories, etc.) —
// the fields are identical across categories, only the values differ.

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string; // some categories omit brand
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

interface ApiErrorResponse {
  message: string;
}

// ---- API calls ----
const DATA_URL = 'https://dummyjson.com/products?';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || (json as ApiErrorResponse).message) {
    throw new Error((json as ApiErrorResponse).message || 'Request failed');
  }
  return json as T;
}

export const getAllProducts = (): Promise<ProductsResponse> => {
  return fetch(DATA_URL)
    .then((res) => handleResponse<ProductsResponse>(res));
};

export const fetchProductsWithPagination = async (limit: number = 4, skip: number = 0): Promise<ProductsResponse> => {
  const safeSkip = typeof skip === 'number' && skip >= 0 ? skip : 0;
  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 4;

  const res = await fetch(`${DATA_URL}?limit=${safeLimit}&skip=${safeSkip}`);
  return await handleResponse<ProductsResponse>(res);
};