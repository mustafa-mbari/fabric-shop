# 📄 Product Requirements Document (PRD)
## Fabric Shop Management Web App

---

## 1. 🎯 Product Overview

**Product Name (Working Title):** Fabric Shop Manager  

**Goal:**  
A mobile-first internal web application used by shop workers and managers to manage:

- Customers
- Debts
- Orders
- Inventory
- Tasks

**Tech Stack:**
- Frontend: Next.js
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth

---

## 2. 👥 Users & Roles

### Worker
- Create orders
- Edit orders
- View customers
- Add debts
- Cannot:
  - Delete data
  - Manage products

### Manager
- Full access
- Manage products
- Soft delete data
- Edit all data

---

## 3. 🧩 Core Modules

---

## 3.1 Customers

### Fields:
- id
- name
- phone (unique)
- address
- created_at

### Features:
- Create customer
- Edit customer
- Search (by name or phone)
- Create customer inside order (popup)

---

## 3.2 Debts

### Notes:
- Debts are independent from orders
- Optional relation to an order

### Types:
- WHOLESALE (جملة)
- RETAIL (متفرقة)

### Fields:
- id
- customer_id
- type (WHOLESALE / RETAIL)
- amount_total
- amount_paid
- remaining (calculated)
- note
- order_id (optional)
- created_at

---

### Payments

### Fields:
- id
- debt_id
- amount
- created_at

---

### Features:
- Create debt
- Add payments
- Track remaining amount
- Filter:
  - Wholesale debts page
  - Retail debts page

---

## 3.3 Inventory

### Notes:
- Product is stored as a single string (name + color)
- Example: "Cotton Fabric - Red"
- No variants system

### Fields:
- id
- name
- type (METER / UNIT)
- quantity
- description
- created_at

### Features:
- Add product (Manager only)
- Edit product
- Manual stock management (no auto deduction)

---

## 3.4 Orders

### Order Fields:
- id
- customer_id (optional)
- customer_name (fallback if no customer)
- status
- total_price
- notes
- delivery_date
- created_at

---

### Order Items

### Fields:
- id
- order_id
- product_name
- quantity
- price_per_unit
- total_price

---

### Features:
- Create order
- Edit order (after creation allowed)
- Multiple products per order
- Auto calculate totals

---

### Order Status:
- NEW
- IN_PROGRESS
- ON_HOLD
- READY
- DELIVERED

---

## 3.5 Tasks

### Fields:
- id
- title
- description
- assigned_to (optional)
- created_by
- created_at

### Features:
- Create task
- Assign to user or leave unassigned
- No notifications
- No deadlines

---

## 4. 📊 Dashboard

Displays:
- Orders count (today)
- Orders in progress
- Total debts
- Total customers count

---

## 5. 🔐 Permissions

| Action           | Worker | Manager |
|------------------|--------|--------|
| Create Order     | Yes    | Yes    |
| Edit Order       | Yes    | Yes    |
| Delete Order     | No     | Yes    |
| Manage Products  | No     | Yes    |
| Manage Debts     | Yes    | Yes    |
| Delete Data      | No     | Yes (Soft) |

---

## 6. 🗑️ Deletion Strategy

- Use Soft Delete:
  - deleted_at field
- Hard delete can be implemented later (cron job)

---

## 7. 📄 Export (PDF)

Supported:
- Customer debts (single customer)
- All debts
- Single order
- All orders

---

## 8. 🎨 UI/UX Requirements

- Mobile-first design
- RTL (Right-to-Left)
- Arabic language only
- Simple dashboard layout

### Pages:

1. Dashboard
2. Customers
3. Debts
   - Tab: Wholesale
   - Tab: Retail
4. Orders
5. Inventory
6. Tasks

---

## 9. 🔄 User Flow Example

### Create Order:
1. Open Orders page
2. Click "Create Order"
3. Select existing customer OR create new (popup)
4. Add products
5. Set quantity and price
6. Save order

---

## 10. 🧱 Database Design (Overview)

### Tables:
- users
- customers
- debts
- payments
- products
- orders
- order_items
- tasks

---

## 11. 🚀 MVP Scope

### Phase 1:
- Authentication
- Customers
- Orders
- Debts

### Phase 2:
- Inventory
- Tasks
- Dashboard

### Phase 3:
- PDF Export
- UI improvements

---

---
