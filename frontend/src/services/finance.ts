import api from './api';
import { Wallet, Category, Transaction, TransactionSummary } from '../types';

// DRF returns paginated responses: { count, next, previous, results: [] }
// This helper extracts the array, supporting both paginated and non-paginated responses
function extractData<T>(response: any): T[] {
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.results) return response.data.results;
  return [];
}

export const walletService = {
  getAll: () => api.get('/wallets/').then(res => extractData<Wallet>(res)),
  create: (data: Partial<Wallet>) => api.post<Wallet>('/wallets/', data),
};

export const categoryService = {
  getAll: () => api.get('/categories/').then(res => extractData<Category>(res)),
  create: (data: Partial<Category>) => api.post<Category>('/categories/', data),
};

export const transactionService = {
  getAll: (params?: { type?: string; wallet?: number }) => 
    api.get('/transactions/', { params }).then(res => extractData<Transaction>(res)),
  create: (data: Partial<Transaction>) => api.post<Transaction>('/transactions/', data),
  getSummary: () => api.get<TransactionSummary>('/transactions/summary/'),
};
