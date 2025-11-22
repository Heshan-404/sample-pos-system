# Quick Start Guide

## Prerequisites
- Node.js (v18 or higher)
- npm

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Initialize database (creates tables and adds sample data)
npm run init-db

# Start the server
npm start
```

**Backend will run on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend folder (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

## Usage

### 1. Item Management
- Navigate to the **Items** tab
- Add new items with name, price, and category (BOT/KOT)
- Search and filter items (client-side only)

### 2. Table Ordering
- Navigate to the **Orders** tab
- Select a table (1-30)
- Search/filter items using the filters
- Add items with quantity
- View current order in real-time

### 3. Billing & Checkout
- Navigate to the **Billing** tab
- Select a table with an active order
- Enter discount amount (optional)
- Check "Add Service Charge" for 10% service charge
- Review the calculated bill
- Click "Finish Bill & Close Order"
- View the completed bill

## Sample Data

The system comes with 18 pre-loaded items:
- 6 BOT items (beverages)
- 12 KOT items (kitchen orders)

## Features Highlight

✅ All filtering happens on the frontend (no backend search)  
✅ Orders behave like carts (items append to existing orders)  
✅ Tables can have only one open order at a time  
✅ Service charge is 10% of subtotal (before discount)  
✅ Bills show complete breakdown with timestamp  

## Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use:

**Backend:** Edit `backend/.env` and change `PORT=5000` to another port

**Frontend:** The Vite dev server will automatically use the next available port

### CORS Issues
Make sure both servers are running. The backend has CORS enabled for all origins.

### Database Issues
Delete `backend/db/restaurant.db` and run `npm run init-db` again.

## API Testing

You can test the API using curl or any API client:

```bash
# Get all items
curl http://localhost:5000/api/items

# Create an item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","price":5.99,"category":"KOT"}'

# Get table order
curl http://localhost:5000/api/orders/1

# Add item to order
curl -X POST http://localhost:5000/api/orders/add-item \
  -H "Content-Type: application/json" \
  -d '{"tableNumber":1,"itemId":1,"quantity":2}'

# Finish order
curl -X POST http://localhost:5000/api/orders/finish \
  -H "Content-Type: application/json" \
  -d '{"tableNumber":1,"discount":5,"serviceCharge":true}'
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
The frontend dev server already has hot-reload enabled.

## Production Build

### Frontend
```bash
cd frontend
npm run build  # Creates production build in dist/
npm run preview  # Preview production build
```

### Backend
The backend runs the same in production. Consider using PM2 or similar for process management.

---

**Enjoy your Restaurant POS System! 🍽️**
