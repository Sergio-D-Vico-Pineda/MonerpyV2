import { login } from "./users/login.ts";
import { create } from "./users/create.ts";
import { logout } from "./users/logout.ts";
import {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getAccounts,
    getCategories,
    getTags
} from "./transactions/index.ts";
import {
    createFamily,
    joinFamily,
    leaveFamily,
    getFamilies,
    getFamilyDetails,
    updateUserRole,
    removeUserFromFamily
} from "./families/index.ts";
import {
    createAccount,
    getAccounts as getAccountsList,
    getAccount,
    getAccountBalanceHistory,
    updateAccount,
    deleteAccount,
    restoreAccount,
    updateDailyBalance,
    recalculateAccountBalance
} from "./accounts/index.ts";

export const server = {
    login: login,
    create: create,
    logout: logout,
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getAccounts,
    getCategories,
    getTags,
    createFamily,
    joinFamily,
    leaveFamily,
    getFamilies,
    getFamilyDetails,
    updateUserRole,
    removeUserFromFamily,
    createAccount,
    getAccountsList,
    getAccount,
    getAccountBalanceHistory,
    updateAccount,
    deleteAccount,
    restoreAccount,
    updateDailyBalance,
    recalculateAccountBalance
};