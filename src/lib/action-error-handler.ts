/**
 * Utility functions for handling Astro action errors and converting them to user-friendly messages
 */

interface ValidationIssue {
    code: string;
    expected?: string;
    received?: string;
    path: string[];
    message: string;
}

interface AstroActionError {
    type?: string;
    code?: string;
    status?: number;
    issues?: ValidationIssue[];
    fields?: Record<string, string[]>;
}

interface ActionResult {
    data?: {
        ok?: boolean;
        error?: string;
    };
    error?: AstroActionError;
}

/**
 * Field name mappings for user-friendly error messages
 */
const FIELD_ERROR_MESSAGES: Record<string, string> = {
    name: "Name is required.",
    color: "Please select a valid color.",
    email: "Valid email is required.",
    password: "Password is required.",
    amount: "Valid amount is required.",
    description: "Description is required.",
    categoryId: "Please select a category.",
    accountId: "Please select an account.",
    tagId: "Please select a tag.",
    date: "Valid date is required.",
};

/**
 * Get user-friendly error message for a specific field
 */
function getFieldErrorMessage(fieldName: string, defaultMessage?: string): string {
    return FIELD_ERROR_MESSAGES[fieldName] || defaultMessage || `${fieldName} is invalid`;
}

/**
 * Parse validation errors from AstroActionInputError and return user-friendly messages
 */
export function parseValidationErrors(error: AstroActionError, customFieldMessages?: Record<string, string>): string[] {
    const fieldErrors: string[] = [];

    if (!error.issues) {
        return fieldErrors;
    }

    error.issues.forEach((issue: ValidationIssue) => {
        if (issue.path && issue.path.length > 0) {
            const fieldName = issue.path[0];

            // Use custom message if provided, otherwise use default mapping
            const customMessage = customFieldMessages?.[fieldName];
            const errorMessage = customMessage || getFieldErrorMessage(fieldName, issue.message);

            fieldErrors.push(errorMessage);
        }
    });

    return fieldErrors;
}

/**
 * Extract user-friendly error message from Astro action result
 */
export function getActionErrorMessage(
    result: ActionResult,
    defaultMessage: string = "An error occurred. Please try again.",
    customFieldMessages?: Record<string, string>
): string {
    // If result.data has a specific error message, use it
    if (result.data?.error) {
        return result.data.error;
    }

    // Handle validation errors
    if (result.error && typeof result.error === "object") {
        // Handle AstroActionInputError structure
        if (result.error.type === "AstroActionInputError" || result.error.issues) {
            const fieldErrors = parseValidationErrors(result.error, customFieldMessages);

            if (fieldErrors.length > 0) {
                return fieldErrors.join(", ");
            }
        }
    }

    return defaultMessage;
}

/**
 * Convenience function for common entity types
 */
export const ActionErrorMessages = {
    /**
     * Get error message for tag-related actions
     */
    tag: (result: ActionResult): string => {
        return getActionErrorMessage(result, "Failed to create tag.", {
            name: "Tag name is required.",
            color: "Please select a valid color."
        });
    },

    /**
     * Get error message for category-related actions
     */
    category: (result: ActionResult): string => {
        return getActionErrorMessage(result, "Failed to create category.", {
            name: "Category name is required.",
            color: "Please select a valid color."
        });
    },

    /**
     * Get error message for transaction-related actions
     */
    transaction: (result: ActionResult): string => {
        return getActionErrorMessage(result, "Failed to create transaction.", {
            amount: "Valid amount is required.",
            description: "Description is required.",
            categoryId: "Please select a category.",
            accountId: "Please select an account.",
            date: "Valid date is required."
        });
    },

    /**
     * Get error message for account-related actions
     */
    account: (result: ActionResult): string => {
        return getActionErrorMessage(result, "Failed to create account.", {
            name: "Account name is required",
            type: "Please select an account type",
            initialBalance: "Valid initial balance is required"
        });
    },

    /**
     * Get error message for user-related actions
     */
    user: (result: ActionResult): string => {
        return getActionErrorMessage(result, "Failed to process user action.", {
            email: "Valid email is required",
            password: "Password is required",
            name: "Name is required"
        });
    }
};
