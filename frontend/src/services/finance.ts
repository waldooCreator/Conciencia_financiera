import { getDb, nowIso } from '../db/client';
import {
  FinanceError,
  WalletRow,
  getWalletById,
  validateTransaction,
  applyBalanceEffect,
  applyTransferBalance,
  validateCreditWallet,
} from '../db/businessLogic';
import {
  Wallet,
  Category,
  Transaction,
  TransactionSummary,
  MonthComparison,
  CategoryComparison,
  SavingsGoal,
} from '../types';

export { FinanceError };

const DEFAULT_CATEGORIES = [
  { name: 'Hormiga', color_hex: '#e74c3c' },
  { name: 'Imprevisto', color_hex: '#f39c12' },
  { name: 'Fijo', color_hex: '#20394a' },
  { name: 'Comida', color_hex: '#2ecc71' },
  { name: 'Transporte', color_hex: '#6196aa' },
  { name: 'Entretenimiento', color_hex: '#9b59b6' },
  { name: 'Salud', color_hex: '#1abc9c' },
  { name: 'Compras', color_hex: '#e67e22' },
];

function mapWallet(row: WalletRow): Wallet {
  const balance = String(row.balance);
  let available_credit: string | undefined;
  if (row.type === 'credit' && row.credit_limit != null) {
    available_credit = String(Math.max(0, row.credit_limit - row.balance));
  }
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance,
    credit_limit: row.credit_limit != null ? String(row.credit_limit) : undefined,
    billing_cycle_date: row.billing_cycle_date ?? undefined,
    available_credit,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

interface TransactionRow {
  id: number;
  wallet_id: number;
  destination_wallet_id: number | null;
  category_id: number | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  installments: number;
  current_installment: number;
  date: string;
  created_at: string;
  updated_at: string;
  wallet_name?: string;
  destination_wallet_name?: string;
  category_name?: string;
}

function mapTransaction(row: TransactionRow): Transaction {
  const installments = row.installments || 1;
  const currentInstallment = row.current_installment || 1;
  const remaining = Math.max(0, installments - currentInstallment + 1);
  const installmentAmount = installments > 0 ? row.amount / installments : row.amount;

  return {
    id: row.id,
    wallet: row.wallet_id,
    wallet_name: row.wallet_name || '',
    destination_wallet: row.destination_wallet_id ?? undefined,
    destination_wallet_name: row.destination_wallet_name ?? undefined,
    category: row.category_id ?? undefined,
    category_name: row.category_name ?? undefined,
    amount: String(row.amount),
    type: row.type,
    description: row.description || '',
    installments,
    current_installment: currentInstallment,
    date: row.date,
    is_synced: true,
    installment_amount: String(installmentAmount),
    remaining_installments: remaining,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

interface GoalRow {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

function mapGoal(row: GoalRow): SavingsGoal {
  const target = row.target_amount;
  const current = row.current_amount;
  const progress = target > 0 ? (current / target) * 100 : 0;
  return {
    id: row.id,
    name: row.name,
    target_amount: String(target),
    current_amount: String(current),
    deadline: row.deadline ?? undefined,
    progress_percentage: progress,
    remaining_amount: String(Math.max(0, target - current)),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const TX_SELECT = `
  SELECT t.*,
    w.name AS wallet_name,
    dw.name AS destination_wallet_name,
    c.name AS category_name
  FROM transactions t
  LEFT JOIN wallets w ON w.id = t.wallet_id
  LEFT JOIN wallets dw ON dw.id = t.destination_wallet_id
  LEFT JOIN categories c ON c.id = t.category_id
`;

export const walletService = {
  getAll: async (): Promise<Wallet[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<WalletRow>('SELECT * FROM wallets ORDER BY id');
    return rows.map(mapWallet);
  },

  getById: async (id: number): Promise<Wallet> => {
    const row = await getWalletById(id);
    if (!row) throw new FinanceError('Cuenta no encontrada');
    return mapWallet(row);
  },

  create: async (data: Partial<Wallet>): Promise<Wallet> => {
    const db = await getDb();
    const type = (data.type || 'debit') as WalletRow['type'];
    const creditLimit = data.credit_limit != null ? parseFloat(String(data.credit_limit)) : null;
    validateCreditWallet(creditLimit, type);

    const ts = nowIso();
    const result = await db.runAsync(
      `INSERT INTO wallets (name, type, balance, credit_limit, billing_cycle_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name || 'Cuenta',
        type,
        parseFloat(String(data.balance ?? 0)) || 0,
        creditLimit,
        data.billing_cycle_date ?? null,
        ts,
        ts,
      ]
    );
    return walletService.getById(result.lastInsertRowId);
  },

  update: async (id: number, data: Partial<Wallet>): Promise<Wallet> => {
    const db = await getDb();
    const existing = await getWalletById(id);
    if (!existing) throw new FinanceError('Cuenta no encontrada');

    const type = (data.type ?? existing.type) as WalletRow['type'];
    const creditLimit =
      data.credit_limit !== undefined
        ? data.credit_limit != null
          ? parseFloat(String(data.credit_limit))
          : null
        : existing.credit_limit;
    validateCreditWallet(creditLimit, type);

    await db.runAsync(
      `UPDATE wallets SET name = ?, type = ?, balance = ?, credit_limit = ?,
       billing_cycle_date = ?, updated_at = ? WHERE id = ?`,
      [
        data.name ?? existing.name,
        type,
        data.balance !== undefined ? parseFloat(String(data.balance)) : existing.balance,
        creditLimit,
        data.billing_cycle_date !== undefined ? data.billing_cycle_date : existing.billing_cycle_date,
        nowIso(),
        id,
      ]
    );
    return walletService.getById(id);
  },

  delete: async (id: number): Promise<void> => {
    const db = await getDb();
    const txCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ? OR destination_wallet_id = ?',
      [id, id]
    );
    if (txCount && txCount.count > 0) {
      throw new FinanceError('No se puede eliminar una cuenta con transacciones asociadas.');
    }
    await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
  },
};

interface CategoryRow {
  id: number;
  name: string;
  color_hex: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color_hex: row.color_hex,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name');
    return rows.map(mapCategory);
  },

  create: async (data: Partial<Category>): Promise<Category> => {
    const db = await getDb();
    const ts = nowIso();
    const result = await db.runAsync(
      'INSERT INTO categories (name, color_hex, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [data.name || 'Categoría', data.color_hex || '#6196aa', data.is_default ? 1 : 0, ts, ts]
    );
    const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [
      result.lastInsertRowId,
    ]);
    if (!row) throw new FinanceError('Error al crear categoría');
    return mapCategory(row);
  },

  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const db = await getDb();
    const existing = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) throw new FinanceError('Categoría no encontrada');

    await db.runAsync(
      'UPDATE categories SET name = ?, color_hex = ?, updated_at = ? WHERE id = ?',
      [data.name ?? existing.name, data.color_hex ?? existing.color_hex, nowIso(), id]
    );
    const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!row) throw new FinanceError('Categoría no encontrada');
    return mapCategory(row);
  },

  delete: async (id: number): Promise<void> => {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  },

  seedDefaults: async (): Promise<{ created: string[]; skipped: string[]; categories: Category[] }> => {
    const db = await getDb();
    const existing = await db.getAllAsync<{ name: string }>('SELECT name FROM categories');
    const existingNames = new Set(existing.map((c) => c.name));
    const created: string[] = [];
    const skipped: string[] = [];
    const ts = nowIso();

    for (const cat of DEFAULT_CATEGORIES) {
      if (existingNames.has(cat.name)) {
        skipped.push(cat.name);
        continue;
      }
      await db.runAsync(
        'INSERT INTO categories (name, color_hex, is_default, created_at, updated_at) VALUES (?, ?, 1, ?, ?)',
        [cat.name, cat.color_hex, ts, ts]
      );
      created.push(cat.name);
    }

    const categories = await categoryService.getAll();
    return { created, skipped, categories };
  },
};

export const transactionService = {
  getAll: async (params?: { type?: string; wallet?: number }): Promise<Transaction[]> => {
    const db = await getDb();
    let query = `${TX_SELECT} WHERE 1=1`;
    const args: (string | number)[] = [];

    if (params?.type) {
      query += ' AND t.type = ?';
      args.push(params.type);
    }
    if (params?.wallet) {
      query += ' AND t.wallet_id = ?';
      args.push(params.wallet);
    }
    query += ' ORDER BY t.date DESC, t.id DESC';

    const rows = await db.getAllAsync<TransactionRow>(query, args);
    return rows.map(mapTransaction);
  },

  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    const db = await getDb();
    const walletId = data.wallet!;
    const wallet = await getWalletById(walletId);
    if (!wallet) throw new FinanceError('Medio de pago no encontrado', 'wallet');

    const type = data.type!;
    const amount = parseFloat(String(data.amount));
    const destId = data.destination_wallet ?? null;
    const destination = destId ? await getWalletById(destId) : null;

    validateTransaction(wallet, type, amount, destination);

    const ts = nowIso();
    const date = data.date || ts;

    if (type === 'transfer' && destination) {
      await applyTransferBalance(wallet.id, destination.id, amount);
    } else {
      await applyBalanceEffect(wallet.id, type, amount);
    }

    const result = await db.runAsync(
      `INSERT INTO transactions
       (wallet_id, destination_wallet_id, category_id, amount, type, description,
        installments, current_installment, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        walletId,
        destId,
        data.category ?? null,
        amount,
        type,
        data.description || '',
        data.installments ?? 1,
        data.current_installment ?? 1,
        date,
        ts,
        ts,
      ]
    );

    const row = await db.getFirstAsync<TransactionRow>(
      `${TX_SELECT} WHERE t.id = ?`,
      [result.lastInsertRowId]
    );
    if (!row) throw new FinanceError('Error al crear transacción');
    return mapTransaction(row);
  },

  update: async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
    const db = await getDb();
    const existing = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) throw new FinanceError('Transacción no encontrada');

    const oldWallet = await getWalletById(existing.wallet_id);
    if (!oldWallet) throw new FinanceError('Cuenta no encontrada');

    const oldDest = existing.destination_wallet_id
      ? await getWalletById(existing.destination_wallet_id)
      : null;

    if (existing.type === 'transfer' && oldDest) {
      await applyTransferBalance(oldWallet.id, oldDest.id, existing.amount, true);
    } else {
      await applyBalanceEffect(oldWallet.id, existing.type, existing.amount, true);
    }

    const newWalletId = data.wallet ?? existing.wallet_id;
    const newType = data.type ?? existing.type;
    const newAmount = data.amount !== undefined ? parseFloat(String(data.amount)) : existing.amount;
    const newDestId =
      data.destination_wallet !== undefined ? data.destination_wallet : existing.destination_wallet_id;

    const newWallet = await getWalletById(newWalletId);
    const newDest = newDestId ? await getWalletById(newDestId) : null;
    if (!newWallet) throw new FinanceError('Medio de pago no encontrado');

    validateTransaction(newWallet, newType, newAmount, newDest);

    if (newType === 'transfer' && newDest) {
      await applyTransferBalance(newWallet.id, newDest.id, newAmount);
    } else {
      await applyBalanceEffect(newWallet.id, newType, newAmount);
    }

    await db.runAsync(
      `UPDATE transactions SET wallet_id = ?, destination_wallet_id = ?, category_id = ?,
       amount = ?, type = ?, description = ?, installments = ?, current_installment = ?,
       date = ?, updated_at = ? WHERE id = ?`,
      [
        newWalletId,
        newDestId,
        data.category !== undefined ? data.category : existing.category_id,
        newAmount,
        newType,
        data.description ?? existing.description,
        data.installments ?? existing.installments,
        data.current_installment ?? existing.current_installment,
        data.date ?? existing.date,
        nowIso(),
        id,
      ]
    );

    const row = await db.getFirstAsync<TransactionRow>(`${TX_SELECT} WHERE t.id = ?`, [id]);
    if (!row) throw new FinanceError('Transacción no encontrada');
    return mapTransaction(row);
  },

  delete: async (id: number): Promise<void> => {
    const db = await getDb();
    const tx = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!tx) return;

    const wallet = await getWalletById(tx.wallet_id);
    if (!wallet) return;

    if (tx.type === 'transfer' && tx.destination_wallet_id) {
      const dest = await getWalletById(tx.destination_wallet_id);
      if (dest) await applyTransferBalance(wallet.id, dest.id, tx.amount, true);
    } else if (tx.type === 'income') {
      await applyBalanceEffect(wallet.id, 'income', tx.amount, true);
    } else if (tx.type === 'expense') {
      await applyBalanceEffect(wallet.id, 'expense', tx.amount, true);
    }

    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  },

  getSummary: async (): Promise<{ data: TransactionSummary }> => {
    const db = await getDb();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const rows = await db.getAllAsync<{ type: string; amount: number; wallet_type: string }>(
      `SELECT t.type, t.amount, w.type AS wallet_type
       FROM transactions t
       JOIN wallets w ON w.id = t.wallet_id
       WHERE t.date >= ?`,
      [startOfMonth]
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const row of rows) {
      if (row.type === 'income' && row.wallet_type !== 'credit') {
        totalIncome += row.amount;
      } else if (row.type === 'expense') {
        totalExpenses += row.amount;
      }
    }

    const countRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE date >= ?',
      [startOfMonth]
    );

    return {
      data: {
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: totalIncome - totalExpenses,
        transaction_count: countRow?.count ?? 0,
      },
    };
  },

  getComparison: async (): Promise<{ data: MonthComparison }> => {
    const db = await getDb();
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const rows = await db.getAllAsync<{
      amount: number;
      date: string;
      category_id: number | null;
      category_name: string | null;
      color_hex: string | null;
    }>(
      `SELECT t.amount, t.date, t.category_id, c.name AS category_name, c.color_hex
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date >= ?`,
      [previousStart.toISOString()]
    );

    const currentMap = new Map<string, CategoryComparison>();
    const previousMap = new Map<string, number>();

    for (const row of rows) {
      const name = row.category_name || 'Sin categoría';
      const color = row.color_hex || '#c9ccc3';
      const key = `${row.category_id ?? 'null'}|${name}|${color}`;
      const txDate = new Date(row.date);

      if (txDate >= currentStart) {
        const existing = currentMap.get(key);
        if (existing) {
          existing.current_amount += row.amount;
        } else {
          currentMap.set(key, {
            category_id: row.category_id,
            category_name: name,
            category_color: color,
            current_amount: row.amount,
            previous_amount: 0,
            delta: 0,
            pct_change: 0,
            trend: 'stable',
          });
        }
      } else {
        previousMap.set(key, (previousMap.get(key) || 0) + row.amount);
      }
    }

    const allKeys = new Set([...currentMap.keys(), ...previousMap.keys()]);
    const categories: CategoryComparison[] = [];

    for (const key of allKeys) {
      const parts = key.split('|');
      const catId = parts[0] === 'null' ? null : parseInt(parts[0], 10);
      const name = parts[1];
      const color = parts[2];
      const current = currentMap.get(key)?.current_amount ?? 0;
      const previous = previousMap.get(key) ?? 0;
      const delta = current - previous;
      const pctChange =
        previous > 0 ? Math.round((delta / previous) * 1000) / 10 : current > 0 ? 100 : 0;

      categories.push({
        category_id: catId,
        category_name: name,
        category_color: color,
        current_amount: current,
        previous_amount: previous,
        delta,
        pct_change: pctChange,
        trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
      });
    }

    categories.sort((a, b) => b.current_amount - a.current_amount);

    const totalCurrent = categories.reduce((s, c) => s + c.current_amount, 0);
    const totalPrevious = categories.reduce((s, c) => s + c.previous_amount, 0);

    return {
      data: {
        period_current: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, '0')}`,
        period_previous: `${previousStart.getFullYear()}-${String(previousStart.getMonth() + 1).padStart(2, '0')}`,
        total_current: totalCurrent,
        total_previous: totalPrevious,
        total_delta: totalCurrent - totalPrevious,
        categories,
      },
    };
  },
};

export const goalService = {
  getAll: async (): Promise<SavingsGoal[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<GoalRow>('SELECT * FROM savings_goals ORDER BY id');
    return rows.map(mapGoal);
  },

  create: async (data: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    const db = await getDb();
    const ts = nowIso();
    const result = await db.runAsync(
      `INSERT INTO savings_goals (name, target_amount, current_amount, deadline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.name || 'Meta',
        parseFloat(String(data.target_amount ?? 0)),
        parseFloat(String(data.current_amount ?? 0)),
        data.deadline ?? null,
        ts,
        ts,
      ]
    );
    const row = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [
      result.lastInsertRowId,
    ]);
    if (!row) throw new FinanceError('Error al crear meta');
    return mapGoal(row);
  },

  update: async (id: number, data: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    const db = await getDb();
    const existing = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!existing) throw new FinanceError('Meta no encontrada');

    await db.runAsync(
      `UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?,
       deadline = ?, updated_at = ? WHERE id = ?`,
      [
        data.name ?? existing.name,
        data.target_amount !== undefined ? parseFloat(String(data.target_amount)) : existing.target_amount,
        data.current_amount !== undefined
          ? parseFloat(String(data.current_amount))
          : existing.current_amount,
        data.deadline !== undefined ? data.deadline : existing.deadline,
        nowIso(),
        id,
      ]
    );
    const row = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!row) throw new FinanceError('Meta no encontrada');
    return mapGoal(row);
  },

  delete: async (id: number): Promise<void> => {
    const db = await getDb();
    await db.runAsync('DELETE FROM savings_goals WHERE id = ?', [id]);
  },

  addFunds: async (id: number, amount: number): Promise<SavingsGoal> => {
    const db = await getDb();
    const goal = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) throw new FinanceError('Meta no encontrada');
    if (amount <= 0) throw new FinanceError('El monto debe ser mayor a cero');

    await db.runAsync(
      'UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = ? WHERE id = ?',
      [amount, nowIso(), id]
    );
    const row = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!row) throw new FinanceError('Meta no encontrada');
    return mapGoal(row);
  },

  withdrawFunds: async (id: number, amount: number): Promise<SavingsGoal> => {
    const db = await getDb();
    const goal = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) throw new FinanceError('Meta no encontrada');
    if (amount <= 0) throw new FinanceError('El monto debe ser mayor a cero');
    if (amount > goal.current_amount) {
      throw new FinanceError('No hay suficientes fondos en la meta.');
    }

    await db.runAsync(
      'UPDATE savings_goals SET current_amount = current_amount - ?, updated_at = ? WHERE id = ?',
      [amount, nowIso(), id]
    );
    const row = await db.getFirstAsync<GoalRow>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!row) throw new FinanceError('Meta no encontrada');
    return mapGoal(row);
  },
};

/** Wipe all local financial data (for reset). */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM wallets;
    DELETE FROM categories;
    DELETE FROM savings_goals;
    DELETE FROM app_settings;
  `);
}
