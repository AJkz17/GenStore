
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
  brand?: string;
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

// -API calls ----
const DATA_URL = 'https://dummyjson.com/products';
const SEARCH_URL = 'https://dummyjson.com/products/search';

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

export const fetchProductsWithPagination = async (limit: number = 0, skip: number = 20): Promise<ProductsResponse> => {
  const safeSkip = typeof skip === 'number' && skip >= 0 ? skip : 0;
  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 20;

  const res = await fetch(`${DATA_URL}?limit=${safeLimit}&skip=${safeSkip}`);
  return await handleResponse<ProductsResponse>(res);
};

// func to render specific product by ID
export async function getProductById(id: string | number): Promise<Product> {
  const res = await fetch(`${DATA_URL}/${id}`);
  return await handleResponse<Product>(res);
}

export const searchProducts = async (query: string): Promise<ProductsResponse> => {
  const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`);
  return await handleResponse<ProductsResponse>(res);
};