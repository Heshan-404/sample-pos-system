# API Documentation

Base URL: `http://localhost:5000/api`

## Items API

### Get All Items
**Endpoint:** `GET /items`

**Description:** Returns all items without any filtering. Filtering should be done on the client side.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Coca Cola",
      "price": 2.50,
      "category": "BOT",
      "created_at": "2025-11-22T10:00:00.000Z"
    }
  ]
}
```

### Create Item
**Endpoint:** `POST /items`

**Request Body:**
```json
{
  "name": "Chicken Burger",
  "price": 8.99,
  "category": "KOT"
}
```

**Validation:**
- `name`: Required, 2-100 characters
- `price`: Required, positive number
- `category`: Required, must be "BOT" or "KOT"

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Chicken Burger",
    "price": 8.99,
    "category": "KOT",
    "created_at": "2025-11-22T10:00:00.000Z"
  }
}
```

---

## Orders API

### Add Item to Order
**Endpoint:** `POST /orders/add-item`

**Description:** Adds an item to a table's order. If the table has an open order, it reuses it. Otherwise, creates a new order.

**Request Body:**
```json
{
  "tableNumber": 5,
  "itemId": 7,
  "quantity": 2
}
```

**Validation:**
- `tableNumber`: Required, integer between 1-30
- `itemId`: Required, valid item ID
- `quantity`: Required, positive integer

**Response:**
```json
{
  "success": true,
  "message": "Item added to order",
  "data": {
    "id": 1,
    "tableNumber": 5,
    "status": "open",
    "created_at": "2025-11-22T10:00:00.000Z"
  }
}
```

### Get Table Order
**Endpoint:** `GET /orders/:tableNumber`

**Description:** Returns the current open order for a table, including all items and total.

**Example:** `GET /orders/5`

**Response (with order):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tableNumber": 5,
    "status": "open",
    "created_at": "2025-11-22T10:00:00.000Z",
    "closed_at": null,
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
    "total": 20.48
  }
}
```

**Response (no order):**
```json
{
  "success": true,
  "data": null,
  "message": "No open order for this table"
}
```

### Finish Order
**Endpoint:** `POST /orders/finish`

**Description:** Completes the order, marks it as closed, and returns the final bill.

**Request Body:**
```json
{
  "tableNumber": 5,
  "discount": 2.50,
  "serviceCharge": true
}
```

**Validation:**
- `tableNumber`: Required, integer between 1-30
- `discount`: Optional, non-negative number (default: 0)
- `serviceCharge`: Optional, boolean (default: false)

**Billing Calculation:**
```
subtotal = sum(item.price * quantity)
serviceChargeAmount = subtotal * 0.10  (only if serviceCharge = true)
finalAmount = subtotal + serviceChargeAmount - discount
```

**Response:**
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
    "discount": 2.50,
    "finalAmount": 20.03,
    "closedAt": "2025-11-22T16:45:30.123Z"
  }
}
```

**Error Response (no order found):**
```json
{
  "success": false,
  "error": "No open order found for this table"
}
```

---

## Health Check

### Check Server Status
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details..."
}
```

### Not Found
```json
{
  "success": false,
  "error": "Route not found"
}
```

---

## Important Notes

⚠️ **No Backend Filtering**: The `/items` endpoint returns ALL items. Apply filters on the client side.

⚠️ **Order Reuse**: When adding items to a table with an existing open order, the items are appended to that order.

⚠️ **Service Charge**: Calculated as 10% of the subtotal (before discount).

⚠️ **Closing Orders**: Once finished, an order's status changes to "closed", and the table is free for new orders.
