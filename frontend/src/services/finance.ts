import api from './api';
import { Wallet, Category, Transaction, TransactionSummary } from '../types';

export const walletService = {
  getAll: () => api.get<Wallet[]>('/wallets/'),
  create: (data: Partial<Wallet>) => api.post<Wallet>('/wallets/', data),
};

export const categoryService = {
  getAll: () => api.get<Category[]>('/categories/'),
  create: (data: Partial<Category>) => api.post<Category>('/categories/', data),
};

export const transactionService = {
  getAll: (params?: { type?: string; wallet?: number }) => 
    api.get<Transaction[]>('/transactions/', { params }),
  create: (data: Partial<Transaction>) => api.post<Transaction>('/transactions/', data),
  getSummary: () => api.get<TransactionSummary>('/transactions/summary/'),
};
