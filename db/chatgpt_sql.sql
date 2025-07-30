CREATE TABLE families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families (id),
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families (id),
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
    ) NOT NULL, -- Ej: "checking", "cash", "loan", "investment"
    balance REAL NOT NULL DEFAULT 0.0, -- Saldo actual
    color TEXT NOT NULL DEFAULT '#6172F3', -- Hex string
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE account_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts (id),
    DATE DATE NOT NULL, -- YYYY-MM-DD
    balance REAL NOT NULL,
    cash_balance REAL NOT NULL DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME UNIQUE (account_id, DATE)
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families (id),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6172F3',
    parent_id INTEGER REFERENCES categories (id) ON DELETE SET NULL, -- para subcategorías
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES families (id),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#e99537',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE transaction_tags (
    transaction_id INTEGER NOT NULL REFERENCES transactions (id),
    tag_id INTEGER NOT NULL REFERENCES tags (id),
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts (id),
    user_id INTEGER NOT NULL REFERENCES users (id),
    category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
    DATE DATE NOT NULL, -- YYYY-MM-DD
    name TEXT NOT NULL,
    amount REAL NOT NULL, -- positivo en todos los casos
    type TEXT CHECK (
        type IN (
            'income',
            'expense',
            'transfer',
            'investment_buy',
            'investment_sell',
            'loan_payment'
        )
    ) NOT NULL, -- "income", "expense", "investment_buy", etc.
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts (id),
    user_id INTEGER NOT NULL REFERENCES users (id),
    category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK (
        type IN (
            'income',
            'expense',
            'investment_buy',
            'investment_sell',
            'loan_disbursement',
            'loan_repayment'
        )
    ) NOT NULL, -- "income", "expense", "investment_buy", etc.
    frequency TEXT CHECK (
        frequency IN (
            'daily',
            'weekly',
            'monthly',
            'yearly'
        )
    ) NOT NULL, -- "daily", "weekly", "monthly", "yearly"
    day_of_month INTEGER, -- para frecuencia mensual/anual
    day_of_week INTEGER, -- 0 (domingo) a 6 (sábado) para semanal
    time_of_day TIME, -- "HH:MM" (24h)
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INTEGER,
    occurrences_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE recurring_transaction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurring_transaction_id INTEGER NOT NULL REFERENCES recurring_transactions (id),
    generated_transaction_id INTEGER REFERENCES transactions (id) ON DELETE SET NULL, -- transacción real creada (opcional)
    execution_time TIMESTAMP NOT NULL, -- unix timestamp 
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_family_id ON users (family_id);

CREATE INDEX idx_users_email ON users (email);
-- ya está UNIQUE, esto es redundante pero común

CREATE INDEX idx_accounts_family_id ON accounts (family_id);

CREATE INDEX idx_accounts_type ON accounts(type);

CREATE INDEX idx_account_balances_account_id_date ON account_balances (account_id, DATE DESC);

CREATE INDEX idx_categories_family_id ON categories (family_id);

CREATE INDEX idx_categories_parent_id ON categories (parent_id);

CREATE INDEX idx_tags_family_id ON tags (family_id);

CREATE INDEX idx_transactions_account_id_date ON transactions (
    account_id,
    transaction_date DESC
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_transactions_category_id ON transactions (category_id);

CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_transactions_deleted_at ON transactions (deleted_at);

CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags (transaction_id);

CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags (tag_id);

CREATE INDEX idx_recurring_transactions_account_id ON recurring_transactions (account_id);

CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions (user_id);

CREATE INDEX idx_recurring_transactions_type ON recurring_transactions(type);

CREATE INDEX idx_recurring_logs_recurring_id ON recurring_transaction_logs (recurring_transaction_id);

CREATE INDEX idx_recurring_logs_generated_id ON recurring_transaction_logs (generated_transaction_id);