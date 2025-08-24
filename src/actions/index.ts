import {
    login,
    create,
    logout,
    getUser,
    changePassword
} from "./users/index.ts";
import {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getAccounts
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
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    restoreCategory
} from "./categories/index.ts";
import {
    createTag,
    getTags,
    getTag,
    updateTag,
    deleteTag,
    restoreTag
} from "./tags/index.ts";

const server = {
    login,
    create,
    logout,
    getUser,
    changePassword,
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getAccounts,
    getCategories,
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
    getCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    createTag,
    getTags,
    getTag,
    updateTag,
    deleteTag,
    restoreTag
};

export { server };