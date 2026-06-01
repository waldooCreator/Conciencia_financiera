import { getDb, nowIso } from './client';

export type WalletType = 'cash' | 'debit' | 'credit';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface WalletRow {
  id: number;
  name: string;
  type: WalletType;
  balance: number;
  credit_limit: number | null;
  billing_cycle_date: number | null;
  created_at: string;
  updated_at: string;
}

export class FinanceError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'FinanceError';
    this.field = field;
  }
}

export async function getWalletById(id: number): Promise<WalletRow | null> {
  const db = await getDb();
  return db.getFirstAsync<WalletRow>('SELECT * FROM wallets WHERE id = ?', [id]);
}

function fmt(n: number): string {
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function validateTransaction(
  wallet: WalletRow,
  type: TransactionType,
  amount: number,
  destination?: WalletRow | null
): void {
  if (amount <= 0) {
    throw new FinanceError('El monto debe ser mayor a cero', 'amount');
  }

  if (type === 'transfer') {
    if (!destination) {
      throw new FinanceError('Selecciona una cuenta de destino para la transferencia.', 'destination_wallet');
    }
    if (wallet.id === destination.id) {
      throw new FinanceError('El origen y el destino no pueden ser la misma cuenta.', 'destination_wallet');
    }

    if (wallet.type === 'credit') {
      if (!wallet.credit_limit) {
        throw new FinanceError(
          'Esta tarjeta no tiene un límite de crédito asignado. Edítala en Cuentas para definir uno.',
          'wallet'
        );
      }
      const available = wallet.credit_limit - wallet.balance;
      if (amount > available) {
        throw new FinanceError(
          `No tienes suficiente crédito disponible.\n\n• Quieres retirar: $${fmt(amount)}\n• Crédito disponible: $${fmt(available)}\n• Deuda actual: $${fmt(wallet.balance)}\n• Límite total: $${fmt(wallet.credit_limit)}`,
          'amount'
        );
      }
    } else if (amount > wallet.balance) {
      throw new FinanceError(
        `Saldo insuficiente en ${wallet.name}.\n\n• Quieres transferir: $${fmt(amount)}\n• Saldo disponible: $${fmt(wallet.balance)}\n\nLa diferencia es de $${fmt(amount - wallet.balance)}.`,
        'amount'
      );
    }

    if (destination.type === 'credit' && amount > destination.balance) {
      throw new FinanceError(
        `No puedes pagar más de lo que debes en ${destination.name}.\n\n• Intentas pagar: $${fmt(amount)}\n• Deuda actual: $${fmt(destination.balance)}\n• Excedente: $${fmt(amount - destination.balance)}\n\nPaga exactamente la deuda o un monto menor.`,
        'amount'
      );
    }
    return;
  }

  if (type === 'expense') {
    if (wallet.type === 'credit') {
      if (!wallet.credit_limit) {
        throw new FinanceError(
          'Esta tarjeta no tiene un límite de crédito. Defínelo en la sección Cuentas.',
          'wallet'
        );
      }
      const available = wallet.credit_limit - wallet.balance;
      if (amount > available) {
        throw new FinanceError(
          `No tienes suficiente crédito disponible en ${wallet.name}.\n\n• Gasto: $${fmt(amount)}\n• Crédito disponible: $${fmt(available)}\n• Deuda actual: $${fmt(wallet.balance)}\n• Límite: $${fmt(wallet.credit_limit)}`,
          'amount'
        );
      }
    } else if (amount > wallet.balance) {
      throw new FinanceError(
        `Saldo insuficiente en ${wallet.name}.\n\n• Gasto: $${fmt(amount)}\n• Saldo disponible: $${fmt(wallet.balance)}\n\nTe faltan $${fmt(amount - wallet.balance)}.`,
        'amount'
      );
    }
  }
}

export async function applyBalanceEffect(
  walletId: number,
  type: TransactionType,
  amount: number,
  reverse = false
): Promise<void> {
  const db = await getDb();
  const wallet = await getWalletById(walletId);
  if (!wallet) return;

  const multiplier = reverse ? -1 : 1;
  let newBalance = wallet.balance;

  if (type === 'income') {
    newBalance += wallet.type === 'credit' ? -amount * multiplier : amount * multiplier;
  } else if (type === 'expense') {
    newBalance += wallet.type === 'credit' ? amount * multiplier : -amount * multiplier;
  }

  await db.runAsync('UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?', [
    newBalance,
    nowIso(),
    walletId,
  ]);
}

export async function applyTransferBalance(
  sourceId: number,
  destinationId: number,
  amount: number,
  reverse = false
): Promise<void> {
  const db = await getDb();
  const source = await getWalletById(sourceId);
  const destination = await getWalletById(destinationId);
  if (!source || !destination) return;

  const multiplier = reverse ? -1 : 1;

  let sourceBalance = source.balance;
  let destBalance = destination.balance;

  if (source.type === 'credit') {
    sourceBalance += amount * multiplier;
  } else {
    sourceBalance -= amount * multiplier;
  }

  if (destination.type === 'credit') {
    destBalance -= amount * multiplier;
  } else {
    destBalance += amount * multiplier;
  }

  const ts = nowIso();
  await db.runAsync('UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?', [
    sourceBalance,
    ts,
    sourceId,
  ]);
  await db.runAsync('UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?', [
    destBalance,
    ts,
    destinationId,
  ]);
}

export function validateCreditWallet(creditLimit: number | null | undefined, type: WalletType): void {
  if (type === 'credit' && (!creditLimit || creditLimit <= 0)) {
    throw new FinanceError('Las tarjetas de crédito requieren un límite mayor a cero.', 'credit_limit');
  }
}
