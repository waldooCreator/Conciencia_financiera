import api from './api';
import { Wallet, Category, Transaction, TransactionSummary, SavingsGoal } from '../types';

// DRF returns paginated responses: { count, next, previous, results: [] }
// This helper extracts the array, supporting both paginated and non-paginated responses
function extractData<T>(response: any): T[] {
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.results) return response.data.results;
  return [];
}

export const walletService = {
  getAll: () => api.get('/wallets/').then(res => extractData<Wallet>(res)),
  getById: (id: number) => api.get<Wallet>(`/wallets/${id}/`),
  create: (data: Partial<Wallet>) => api.post<Wallet>('/wallets/', data),
  update: (id: number, data: Partial<Wallet>) => api.patch<Wallet>(`/wallets/${id}/`, data),
  delete: (id: number) => api.delete(`/wallets/${id}/`),
};

export const categoryService = {
  getAll: () => api.get('/categories/').then(res => extractData<Category>(res)),
  create: (data: Partial<Category>) => api.post<Category>('/categories/', data),
  update: (id: number, data: Partial<Category>) => api.patch(`/categories/${id}/`, data),
  delete: (id: number) => api.delete(`/categories/${id}/`),
};

export const transactionService = {
  getAll: (params?: { type?: string; wallet?: number }) => 
    api.get('/transactions/', { params }).then(res => extractData<Transaction>(res)),
  create: (data: Partial<Transaction>) => api.post<Transaction>('/transactions/', data),
  update: (id: number, data: Partial<Transaction>) => api.patch(`/transactions/${id}/`, data),
  delete: (id: number) => api.delete(`/transactions/${id}/`),
  getSummary: () => api.get<TransactionSummary>('/transactions/summary/'),
};

export const goalService = {
  getAll: () => api.get('/goals/').then(res => extractData<SavingsGoal>(res)),
  create: (data: Partial<SavingsGoal>) => api.post('/goals/', data),
  update: (id: number, data: Partial<SavingsGoal>) => api.patch(`/goals/${id}/`, data),
  delete: (id: number) => api.delete(`/goals/${id}/`),
  addFunds: (id: number, amount: number) => api.post(`/goals/${id}/add_funds/`, { amount }),
  withdrawFunds: (id: number, amount: number) => api.post(`/goals/${id}/withdraw_funds/`, { amount }),
};
