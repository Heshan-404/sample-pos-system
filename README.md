# Restaurant POS System

A complete restaurant ordering system with React frontend and Node.js/Express backend using SQLite database.

## 🎯 Features

### 1. Item Management
- Create new items with name, price, and category (BOT/KOT)
- View all items
- **Client-side** search by name
- **Client-side** filter by category

### 2. Table Ordering
- 30 tables (1-30)
- Add items to table orders
- Orders behave like carts (reuse open orders)
- View current order for any table
- Client-side item filtering while ordering

### 3. Billing & Checkout
- View order details for any table
- Apply manual discount
- Optional 10% service charge
- Automatic bill calculation
- Close orders and free up tables

## 📁 Project Structure

```
samplePOS/
├── backend/
│   ├── controllers/
│   │   ├── itemController.js
│   │   └── orderController.js
│   ├── db/
│   │   ├── database.js
│   │   ├── init.js
│   │   └── restaurant.db (generated)
│   ├── routes/
│   │   ├── itemRoutes.js
│   │   └── orderRoutes.js
│   ├── services/
│   │   ├── itemService.js
│   │   └── orderService.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ItemManagement.jsx
    │   │   ├── OrderPage.jsx
    │   │   └── BillingPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🗄️ Database Schema

### Items Table
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('BOT', 'KOT')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tableNumber INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME
)
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  itemId INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
)
```

## 🔌 API Endpoints

### Items
- **POST** `/api/items` - Create new item
  ```json
  {
    "name": "Chicken Burger",
    "price": 8.99,
    "category": "KOT"
  }
  ```

- **GET** `/api/items` - Get all items (no filtering)
  ```json
  {
    "success": true,
    "data": [...]
  }
  ```

### Orders
- **POST** `/api/orders/add-item` - Add item to table order
  ```json
  {
    "tableNumber": 5,
    "itemId": 3,
    "quantity": 2
  }
  ```

- **GET** `/api/orders/:tableNumber` - Get order for table
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "tableNumber": 5,
      "status": "open",
      "items": [...],
      "total": 25.50
    }
  }
  ```

- **POST** `/api/orders/finish` - Finish order and generate bill
  ```json
  {
    "tableNumber": 5,
    "discount": 2.50,
    "serviceCharge": true
  }
  ```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize database (creates tables and sample data):
```bash
npm run init-db
```

4. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Backend will run on **http://localhost:5000**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on **http://localhost:5173** (or the port shown in terminal)

## 📋 Sample Data

The database initialization includes sample items:

**BOT Items (Beverages):**
- Coca Cola - $2.50
- Pepsi - $2.50
- Sprite - $2.50
- Water Bottle - $1.00
- Orange Juice - $3.50
- Lemonade - $3.00

**KOT Items (Kitchen Orders):**
- Chicken Burger - $8.99
- Beef Burger - $9.99
- Veggie Burger - $7.99
- French Fries - $3.99
- Onion Rings - $4.99
- Caesar Salad - $6.99
- Margherita Pizza - $12.99
- Pepperoni Pizza - $14.99
- Grilled Chicken - $11.99
- Fish and Chips - $13.99
- Spaghetti Carbonara - $10.99
- Chicken Wings - $8.99

## 💰 Billing Calculation

```
subtotal = sum(item.price * quantity)
serviceChargeAmount = subtotal * 0.10  (if service charge is checked)
finalAmount = subtotal + serviceChargeAmount - discount
```

## 📊 Example Final Bill JSON

```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "tableNumber": 5,
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "itemId": 7,
        "name": "Chicken Burger",
        "price": 8.99,
        "category": "KOT",
        "subtotal": 17.98
      },
      {
        "id": 2,
        "quantity": 1,
        "itemId": 1,
        "name": "Coca Cola",
        "price": 2.50,
        "category": "BOT",
        "subtotal": 2.50
      }
    ],
    "subtotal": 20.48,
    "serviceCharge": true,
    "serviceChargeAmount": 2.05,
    "discount": 2.00,
    "finalAmount": 20.53,
    "closedAt": "2025-11-22T16:45:30.123Z"
  }
}
```

## 🎨 Frontend Features

### Client-Side Filtering
All filtering is done in the frontend:
- Search items by name (case-insensitive)
- Filter by category (BOT, KOT, or ALL)

### Pages
1. **Items Page** - Manage and view all items
2. **Orders Page** - Select table and add items
3. **Billing Page** - Generate bills and close orders

### UI/UX
- Beautiful gradient design
- Dark mode support
- Responsive layout
- Real-time bill calculation
- Smooth transitions and animations

## 🔑 Key Points

✅ **No backend filtering** - All search and filter logic is in the frontend  
✅ **Order reuse** - Tables with open orders reuse the same order  
✅ **Cart behavior** - Adding items appends to existing order  
✅ **Service charge** - 10% calculated on subtotal (before discount)  
✅ **Order closure** - After finishing, order becomes closed and table is free  

## 🛠️ Technology Stack

**Frontend:**
- React 19
- TailwindCSS
- Axios
- Vite

**Backend:**
- Node.js
- Express
- better-sqlite3
- express-validator

## 📝 License

ISC

## 👨‍💻 Developer Notes

- CORS is enabled for all origins
- Database file is created automatically on first run
- Foreign keys are enabled in SQLite
- All API responses follow the format: `{ success: boolean, data/error: any }`
- Input validation is handled on backend
- Transactions are used for data consistency
