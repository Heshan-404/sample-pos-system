# 🎯 PAYMENT FEATURE - FINAL COMPLETION STEPS

## ✅ COMPLETED (80%):

1. ✅ Database migration - Ready
2. ✅ Order Controller - Updated  
3. ✅ Order Service - Updated with paymentMethod and additionalItems

## 🔧 REMAINING (20% - Manual edits needed):

### File 1: BillingPage.jsx (frontend/src/components/BillingPage.jsx)

**EDIT 1 - Line 13:** Change from `false` to `true`
```javascript
// OLD:
const [serviceCharge, setServiceCharge] = useState(false);

// NEW:
const [serviceCharge, setServiceCharge] = useState(true); // Default to true
const [paymentMethod, setPaymentMethod] = useState('CASH');
const [additionalItems, setAdditionalItems] = useState('');
```

**EDIT 2 - Line 32:** Reset values
```javascript
// OLD:
setServiceCharge(false);

// NEW:
setServiceCharge(true); // Default true
setPaymentMethod('CASH');
setAdditionalItems('');
```

**EDIT 3 - Line 64:** Add to API call
```javascript
// OLD:
const response = await ordersAPI.finishOrder({
    tableNumber: selectedTable,
    discount: parseFloat(discount || 0),
    serviceCharge: serviceCharge,
});

// NEW:
const response = await ordersAPI.finishOrder({
    tableNumber: selectedTable,
    discount: parseFloat(discount || 0),
    serviceCharge: serviceCharge,
    paymentMethod: paymentMethod,
    additionalItems: additionalItems,
});
```

**EDIT 4 - Line 70:** Reset after finish
```javascript
// OLD:
setServiceCharge(false);

// NEW:
setServiceCharge(true); // Reset to default true
setPaymentMethod('CASH');
setAdditionalItems('');
```

**EDIT 5 - Around line 252:** Add UI fields BEFORE discount field

```jsx
<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg space-y-4">
    <h3 className="text-lg font-semibold">Billing Options</h3>
    
    {/* ADD THIS - Payment Method */}
    <div>
        <label className="block text-sm font-medium mb-2">Payment Method</label>
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                    paymentMethod === 'CASH' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
                💵 Cash
            </button>
            <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                    paymentMethod === 'CARD' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
                💳 Card
            </button>
        </div>
    </div>

    {/* ADD THIS - Additional Items */}
    <div>
        <label className="block text-sm font-medium mb-2">Additional Items (Optional)</label>
        <input
            type="text"
            className="input-field"
            value={additionalItems}
            onChange={(e) => setAdditionalItems(e.target.value)}
            placeholder="e.g., Extra napkins, spoon, takeaway box"
        />
    </div>
    
    {/* Existing discount field stays here */}
    <div>
        <label className="block text-sm font-medium mb-2">Discount Amount (LKR)</label>
        ...
```

### File 2: QuickBillPage.jsx (frontend/src/components/QuickBillPage.jsx)

**Same 5 edits as BillingPage.jsx above**

### File 3: printService.js (backend/services/printService.js)

Find the `formatReceipt` function and add AFTER the discount/service charge section (around line 60):

```javascript
// After discount line, add:
if (orderData.additionalItems) {
    receipt += `    Additional: ${orderData.additionalItems}\n`;
    receipt += `    -------------------------------------------\n`;
}

receipt += `    Payment Method: ${orderData.paymentMethod}\n`;
receipt += `\n`;
```

## 🧪 Testing:

1. Restart backend (migration runs automatically)
2. Test table order - Cash payment
3. Test table order - Card payment  
4. Test with additional items
5. Verify service charge is checked by default
6. Print receipt - verify payment method shows
7. Print receipt - verify additional items show
8. Same tests for Quick Bill

## ✨ Feature Complete When:
- [ ] Service charge defaults to TRUE (checked)
- [ ] Payment method toggle works (Cash/Card)
- [ ] Additional items field works
- [ ] Data saves correctly in database
- [ ] Receipt prints payment method
- [ ] Receipt prints additional items (if present)
