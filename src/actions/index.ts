import {
    login,
    create,
    logout,
    getUser
} from "./users/index.ts";
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
    getUser: getUser,
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