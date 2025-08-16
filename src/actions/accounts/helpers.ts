import { prisma } from '@prisma/index.js';
import { getCurrentDateTime, getCurrentDate } from '@lib/date-utils.ts';

enum TransactionType {
    Income = 'Income',
    Expense = 'Expense',
    InvestmentBuy = 'InvestmentBuy',
    InvestmentSell = 'InvestmentSell',
    LoanPayment = 'LoanPayment',
    LoanRepayment = 'LoanRepayment'
}

/**
 * Updates daily balance records for an account
 * This should be called whenever a transaction affects an account balance
 */
export async function updateDailyBalance(accountId: number, date?: string) {
    try {
        // Use provided date or current date (YYYY-MM-DD format)
        const balanceDate = date || getCurrentDate();

        // Get current account balance
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            select: { balance: true }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        // Update or create daily balance record
        await prisma.accountBalance.upsert({
            where: {
                accountId_date: {
                    accountId,
                    date: balanceDate
                }
            },
            update: {
                balance: account.balance,
                cashBalance: account.balance, // For now, assume cash balance equals total balance
                updatedAt: getCurrentDateTime()
            },
            create: {
                accountId,
                date: balanceDate,
                balance: account.balance,
                cashBalance: account.balance,
                createdAt: getCurrentDateTime(),
                updatedAt: getCurrentDateTime()
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating daily balance:', error);
        return { success: false, error };
    }
}

/**
 * Recalculate account balance based on all transactions
 * This is useful for ensuring data consistency
 */
export async function recalculateAccountBalance(accountId: number) {
    try {
        // Get all non-deleted transactions for this account
        const transactions = await prisma.transaction.findMany({
            where: {
                accountId,
                deletedAt: null
            },
            select: {
                amount: true,
                type: true
            }
        });

        // Calculate balance (safe guards + logging)
        let balance = 0;
        // Allowed transaction types: TransactionType.Income, TransactionType.Expense, TransactionType.InvestmentBuy, TransactionType.InvestmentSell, TransactionType.LoanPayment, TransactionType.LoanRepayment
        for (const transaction of transactions) {
            // Ensure amount is a finite number; fallback to 0 if invalid
            const raw = (transaction as any).amount;
            const amt = typeof raw === 'number' ? raw : Number(raw);
            const amount = Number.isFinite(amt) ? amt : 0;

            switch (transaction.type) {
                case TransactionType.Income:
                case TransactionType.InvestmentSell:
                case TransactionType.LoanRepayment:
                    balance += amount;
                    break;
                case TransactionType.Expense:
                case TransactionType.InvestmentBuy:
                case TransactionType.LoanPayment:
                    balance -= amount;
                    break;
                default:
                    // Unexpected transaction type — warn so it can be investigated
                    // Do not change balance for unknown types
                    // eslint-disable-next-line no-console
                    console.warn(`recalculateAccountBalance: unknown transaction type for account ${accountId}:`, transaction.type);
            }
        }

        // Round to 2 decimals to avoid storing excessively long float imprecision
        balance = Number(balance.toFixed(2));


        // Update account balance
        await prisma.account.update({
            where: { id: accountId },
            data: {
                balance,
                updatedAt: getCurrentDateTime()
            }
        });

        // Update today's daily balance
        await updateDailyBalance(accountId);

        return { success: true, balance };
    } catch (error) {
        console.error('Error recalculating account balance:', error);
        return { success: false, error };
    }
}
