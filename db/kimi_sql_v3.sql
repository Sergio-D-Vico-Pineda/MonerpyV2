-- 0) Enable foreign-key enforcement
PRAGMA foreign_keys = ON;

--------------------------------------------------------------------
-- 1) Families & Users
--------------------------------------------------------------------
CREATE TABLE family (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family (id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

--------------------------------------------------------------------
-- 2) Accounts
--------------------------------------------------------------------
CREATE TABLE account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family (id),
    name TEXT NOT NULL,
    account_type TEXT CHECK (
        account_type IN (
            'cash',
            'checking',
            'savings',
            'credit_card',
            'investment',
            'loan'
        )
    ) NOT NULL,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

--------------------------------------------------------------------
-- 3) Categories (self-referencing hierarchy)
--------------------------------------------------------------------
CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family (id),
    parent_id INTEGER REFERENCES category (id),
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- hex string #RRGGBB
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

--------------------------------------------------------------------
-- 4) Tags
--------------------------------------------------------------------
CREATE TABLE tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family (id),
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- hex string #RRGGBB
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

--------------------------------------------------------------------
-- 5) Transactions
--------------------------------------------------------------------
CREATE TABLE transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES account (id),
    user_id INTEGER NOT NULL REFERENCES user (id),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL, -- positive for inflow, negative for outflow
    type TEXT CHECK (
        type IN (
            'income',
            'expense',
            'investment_buy',
            'investment_sell',
            'loan_disbursement',
            'loan_repayment'
        )
    ) NOT NULL,
    category_id INTEGER REFERENCES category (id),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

-- many-to-many link to tags
CREATE TABLE transaction_tag (
    transaction_id INTEGER NOT NULL REFERENCES transaction (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

--------------------------------------------------------------------
-- 6) Recurring Transactions
--------------------------------------------------------------------
CREATE TABLE recurring_transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES account (id),
    user_id INTEGER NOT NULL REFERENCES user (id),
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    type TEXT CHECK (
        type IN (
            'income',
            'expense',
            'investment_buy',
            'investment_sell',
            'loan_disbursement',
            'loan_repayment'
        )
    ) NOT NULL,
    category_id INTEGER REFERENCES category (id),
    frequency TEXT CHECK (
        frequency IN (
            'daily',
            'weekly',
            'monthly',
            'yearly'
        )
    ) NOT NULL,
    interval_value INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INTEGER,
    next_due_date DATE NOT NULL,
    hour INTEGER CHECK (hour BETWEEN 0 AND 23) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

-- many-to-many link to tags
CREATE TABLE recurring_transaction_tag (
    recurring_transaction_id INTEGER NOT NULL REFERENCES recurring_transaction (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
    PRIMARY KEY (
        recurring_transaction_id,
        tag_id
    )
);

--------------------------------------------------------------------
-- 7) Helpful indices
--------------------------------------------------------------------
CREATE INDEX idx_transaction_account_date ON transaction (account_id, transaction_date);

CREATE INDEX idx_transaction_user ON transaction (user_id);

CREATE INDEX idx_recurring_account_next ON recurring_transaction (account_id, next_due_date);