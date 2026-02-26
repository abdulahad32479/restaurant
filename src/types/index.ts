export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string; // Backend uses decimal/string
  stock: number;
  category: string; // Category ID
  image?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
