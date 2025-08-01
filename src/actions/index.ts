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
    createRecurringTransaction,
    getRecurringTransactions,
    getRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getAccounts as getAccountsForRecurring,
    getCategories as getCategoriesForRecurring,
    getTags as getTagsForRecurring,
    generateRecurringTransactions
} from "./recurring-transactions/index.ts";
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
import {
    createCategory,
    getCategories as getCategoriesList,
    getCategory,
    updateCategory,
    deleteCategory,
    restoreCategory
} from "./categories/index.ts";
import {
    createTag,
    getTags as getTagsList,
    getTag,
    updateTag,
    deleteTag,
    restoreTag
} from "./tags/index.ts";

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
    createRecurringTransaction,
    getRecurringTransactions,
    getRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getAccountsForRecurring,
    getCategoriesForRecurring,
    getTagsForRecurring,
    generateRecurringTransactions,
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
    recalculateAccountBalance,
    createCategory,
    getCategoriesList,
    getCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    createTag,
    getTagsList,
    getTag,
    updateTag,
    deleteTag,
    restoreTag
};