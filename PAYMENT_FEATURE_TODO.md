# REMAINING TASKS - Payment Method & Additional Items

## ✅ COMPLETED (60%):
1. Database migration created and runs on server start
2. Order controller updated to accept paymentMethod and additionalItems
3. Files are ready, just need manual edits

## 🔄 NEXT STEPS (40% remaining):

### Step 1: Update orderService.js (Line 101)
File: `backend/services/orderService.js`

Change line 101 from:
```javascript
finishOrder(tableNumber, discount = 0, serviceCharge = false) {
```

To:
```javascript
finishOrder(tableNumber, discount = 0, serviceCharge = false, paymentMethod = 'CASH', additionalItems = '') {
```

Change line 102 from:
```javascript
const finish = db.transaction((tableNum, disc, svcCharge) => {
```

To:
```javascript
const finish = db.transaction((tableNum, disc, svcCharge, payMethod, addItems) => {
```

Change lines 118-121 (INSERT statement) from:
```javascript
INSERT INTO orders_history (
  orderId, tableNumber, subtotal, discount, 
  serviceCharge, serviceChargeAmount, finalAmount, closed_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

To:
```javascript
INSERT INTO orders_history (
  orderId, tableNumber, subtotal, discount, 
  serviceCharge, serviceChargeAmount, finalAmount, closed_at,
  paymentMethod, additionalItems
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Add to historyResult.run() (after line 132):
```javascript
payMethod,
addItems
```

Change line 176 from:
```javascript
return finish(tableNumber, discount, serviceCharge);
```

To:
```javascript
return finish(tableNumber, discount, serviceCharge, paymentMethod, additionalItems);
```

### Step 2: Update BillingPage.jsx
File: `frontend/src/components/BillingPage.jsx`

Add new state (around line 20):
```javascript
const [paymentMethod, setPaymentMethod] = useState('CASH');
const [additionalItems, setAdditionalItems] = useState('');
```

Change serviceCharge initial state from `false` to `true`:
```javascript
const [serviceCharge, setServiceCharge] = useState(true); // Changed from false
```

Add UI before discount section:
```jsx
{/* Payment Method */}
<div className="mb-4">
    <label className="block text-sm font-medium mb-2">Payment Method</label>
    <div className="flex gap-2">
        <button
            onClick={() => setPaymentMethod('CASH')}
            className={`flex-1 px-4 py-2 rounded ${
                paymentMethod === 'CASH'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800'
            }`}
        >
            💵 Cash
        </button>
        <button
            onClick={() => setPaymentMethod('CARD')}
            className={`flex-1 px-4 py-2 rounded ${
                paymentMethod === 'CARD'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
            }`}
        >
            💳 Card
        </button>
    </div>
</div>

{/* Additional Items */}
<div className="mb-4">
    <label className="block text-sm font-medium mb-2">Additional Items (Optional)</label>
    <input
        type="text"
        className="input-field"
        value={additionalItems}
        onChange={(e) => setAdditionalItems(e.target.value)}
        placeholder="e.g., Extra napkins, spoon, takeaway box"
    />
</div>
```

Update handleFinishBill API call:
```javascript
await ordersAPI.finishOrder({
    tableNumber,
    discount,
    serviceCharge,
    paymentMethod,      // ADD THIS
    additionalItems     // ADD THIS
});
```

### Step 3: Update QuickBillPage.jsx
File: `frontend/src/components/QuickBillPage.jsx`

**Same changes as BillingPage.jsx above**

### Step 4: Update printService.js
File: `backend/services/printService.js`

In formatReceipt function, add after discount line (around line 60):
```javascript
if (orderData.additionalItems) {
    receipt += `    ${orderData.additionalItems}\n`;
    receipt += `    -------------------------------------------\n`;
}

receipt += `    Payment Method: ${orderData.paymentMethod}\n`;
receipt += `\n`;
```

## 📝 Testing Checklist:
- [ ] Restart backend server (migration runs automatically)
- [ ] Test Table Order with Cash payment
- [ ] Test Table Order with Card payment
- [ ] Test with Additional Items field
- [ ] Test Quick Bill with Cash/Card
- [ ] Verify service charge defaults to true
- [ ] Print receipt and verify payment method shows
- [ ] Print receipt and verify additional items show
- [ ] Check orders history displays correctly

## ⚠️ IMPORTANT:
- Service charge MUST default to `true` (checked by default)
- Payment method defaults to 'CASH'
- Additional items is optional (empty string if not provided)
