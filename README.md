# Product Requirements Document (PRD)

## Product Name
**Monerpy**

## Overview
Monerpy is a comprehensive personal finance management web application designed to help users (individuals and families) gain better control over their spending habits. It offers features such as transaction tracking, recurring payments, detailed analytics, and account balance history — all through a responsive, PWA-capable interface that works both online and offline.

---

## Goals
- Empower users to take control of their income and expenses.
- Provide a clear, simple interface for tracking financial transactions.
- Enable financial visibility through categorized analytics.
- Support multiple users per family, each with role-based permissions.

---

## Target Audience
- Primary User: The developer (25 y/o, tech-savvy).
- Secondary Users: Broader public, including tech-savvy individuals and small families seeking intuitive personal finance tracking.

---

## Tech Stack
- **Frontend:** Astro v5.12.5 + TailwindCSS v4.1.11 + JavaScript
- **Backend:** TypeScript with Prisma ORM v6.13.0
- **Database:** Turso (LibSQL / SQLite-compatible)
- **Hosting:** Vercel or Node.js for local development
- **CLI:** pnpm
- **Authentication:** Custom (email + password via database)
- **Deployment Target:** Web (with Progressive Web App support)

---

## Features

### Core MVP Features
| Feature                        | Description                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Manual Transaction Entry**   | Users can create income, expense, investment, and loan transactions manually.                                        |
| **Recurring Transactions**     | Define transactions with frequencies (daily, weekly, monthly, yearly) with automatic generation and tracking.        |
| **Account Management**         | Create and manage different account types (checking, cash, investment, loan).                                        |
| **Account Balances Over Time** | Track daily balances and historical values for each account.                                                         |
| **Categorization & Tagging**   | Assign categories (with parent-child support) and custom color-coded tags to transactions.                           |
| **Financial Analytics**        | Graphs and tables summarizing income/expenses by time period, category, and tag. Comparisons over time included.     |
| **Multi-User Support**         | Families can have multiple users. Roles: **admin** (manage accounts/users), **member** (add/view transactions only). |
| **Progressive Web App**        | Responsive UI with offline capability: local storage of transactions and background sync.                            |

---

## Out of Scope for MVP
- Budgeting tools or financial goal planning.
- Third-party authentication (Google, Apple, etc.).
- Transaction import (CSV or bank integration).
- Notifications or alerts.
- AI-based recommendations or automation.

---

## Database Overview (from schema)

### Tables Used
- `families`: Grouping of users.
- `users`: Can belong to a family. Has roles.
- `accounts`: Linked to families. Tracks type and balance.
- `account_balances`: Daily balance tracking.
- `categories`: Hierarchical spending categories.
- `tags`: Custom, color-coded labels for transactions.
- `transactions`: Manual and generated financial records.
- `recurring_transactions`: Templates for future transactions.
- `recurring_transaction_logs`: Logs of generated transactions.
- `transaction_tags`: Many-to-many relation for tags and transactions.

---

## Analytics Requirements
- **Time-Based Summaries:**
  - Daily, Weekly, Monthly, and Yearly
- **Visualizations:**
  - Pie charts (by category/tag)
  - Bar graphs (over time)
- **Comparisons:**
  - Current vs. previous period (e.g., this month vs. last month)

---

## Roles and Permissions

| Role   | Permissions                                       |
| ------ | ------------------------------------------------- |
| Admin  | Full access: manage accounts, users, transactions |
| Member | Can view and create transactions only             |

---

## Offline Support (PWA)
- Store unsynced transactions locally when offline.
- Automatically sync with backend when connection is restored.
- Full responsive layout for mobile use.
- Installation support via Add-to-Home-Screen (A2HS) on mobile devices.

---

## Success Criteria
- User can track multiple accounts and transactions with real-time balance updates.
- Recurring transactions generate correctly and are logged.
- Analytics are meaningful and visually clear.
- Offline usage is smooth, and data syncs without conflict.

---

## Appendix
- [Astro](https://astro.build)
- [Prisma ORM](https://www.prisma.io)
- [Turso (LibSQL)](https://turso.tech)
- [TailwindCSS](https://tailwindcss.com)
- [pnpm](https://pnpm.io)

---
    
## Project Folder Structure

The following folder structure is designed to support Monerpy’s modular and scalable development using Astro, Prisma, and a modern component-based architecture.

```shell
/
├───db # Database scripts, seeds, and SQL snapshots  
│  
├───prisma # Prisma configuration  
│ └───migrations # Auto-generated database migration history  
│  
├───public # Static assets served directly (e.g., icons, manifest)  
│  
└───src # Application source code  
├───assets # Images, icons, fonts, and other media files  
├───components # Reusable UI components (buttons, cards, charts, etc.)  
├───layouts # Page layouts and layout wrappers  
├───lib # Business logic, utilities, and services  
│ ├───services # API interaction, database access helpers  
│ └───validation # Custom validation logic (e.g., functions, constraints)  
├───middleware # Custom middleware for authentication, roles, etc.  
├───pages # Route-based pages and API endpoints  
│ ├───api # Backend API routes  
│ │ ├───auth # Login, registration, and auth helpers  
│ │ ├───calendar # Calendar-based transaction views  
│ │ ├───recurring-transactions # Recurring transaction APIs  
│ │ ├───transaction-groups # APIs for grouped transactions  
│ │ ├───transactions # CRUD endpoints for transactions  
│ │ └───user # User profile, role, and family APIs  
│ ├───profile # Profile page  
│ ├───recurring-transactions  
│ │ └───[id] # Dynamic routes for transaction editing  
│ ├───transaction-groups  
│ │ └───[id] # Dynamic grouped transaction detail  
│ └───transactions  
│ └───[id] # Transaction detail/edit route  
├───styles # Global and component-specific styles  
└───types # TypeScript types and interfaces  
```

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

![License](image.png)

<a href="https://github.com/Scarpy19/Monerpy">Monerpy</a> © 2025 by <a href="https://github.com/Scarpy19">Scarpy19</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

favicon.ico Image from Dead Cells by Motion Twin, licensed under CC BY-NC-SA 4.0

 