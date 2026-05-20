export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Wallet {
  id: number;
  name: string;
  type: 'cash' | 'debit' | 'credit';
  balance: string;
  credit_limit?: string;
  billing_cycle_date?: number;
  available_credit?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color_hex: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  wallet: number;
  wallet_name: string;
  category?: number;
  category_name?: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  installments: number;
  current_installment: number;
  date: string;
  is_synced: boolean;
  installment_amount: string;
  remaining_installments: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  deadline?: string;
  progress_percentage: number;
  remaining_amount: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
}
