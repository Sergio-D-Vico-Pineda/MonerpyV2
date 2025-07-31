import { prisma } from '@prisma/index.js';
import { getCurrentDateTime, getCurrentDate } from '@lib/date-utils.ts';

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

        // Calculate balance
        let balance = 0;
        for (const transaction of transactions) {
            switch (transaction.type) {
                case 'Income':
                    balance += transaction.amount;
                    break;
                case 'Expense':
                case 'InvestmentBuy':
                case 'LoanPayment':
                    balance -= transaction.amount;
                    break;
                case 'InvestmentSell':
                case 'LoanRepayment':
                    balance += transaction.amount;
                    break;
            }
        }

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
