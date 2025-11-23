# Print Server Setup Guide

## Overview
The print server enables automatic printing of receipts when bills are finalized in the Restaurant POS system. It communicates with thermal printers over TCP/IP using ESC/POS commands.

## Architecture
1. **Frontend** → Finalize Bill
2. **Backend** → Creates print job → Sends via WebSocket
3. **Print Server** → Receives job → Prints to thermal printer

## Setup Instructions

### 1. Install Dependencies

Backend:
```bash
cd backend
npm install
```

Print Server:
```bash
cd print-server
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### 2. Configure Printer

1. Connect your ESC/POS thermal printer to your network
2. Find the printer's IP address (usually printed on a network configuration page)
3. Note the printer port (default is usually 9100)

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Print Server:**
```bash
cd print-server
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Register a Printer

1. Open the POS system in your browser
2. Navigate to the **Printers** tab
3. Click **+ Add Printer**
4. Enter:
   - **Name**: e.g., "Kitchen Printer"
   - **IP Address**: Your printer's IP (e.g., 192.168.1.100)
   - **Port**: Usually 9100
5. Click **Register Printer**
6. Ensure the printer is marked as **Active** (green)

## Usage

### Automatic Printing
When you finalize a bill in the Billing page:
1. Bill is saved to the database
2. A print job is automatically created
3. The print server receives the job
4. Receipt prints on the configured printer

### Print Server Status
The print server logs show:
- ✅ Connected to cloud backend
- 📨 Received print job
- ✅ Connected to printer
- ✅ Print job completed

### Troubleshooting

**Print Server Not Connected**
- Ensure backend is running first
- Check that `BACKEND_URL` in print-server matches your backend URL
- Default: `http://localhost:5000`

**No Active Printer**
- Go to Printers tab
- Register a printer
- Click the status to toggle it to Active

**Printer Not Responding**
- Verify printer IP address
- Check printer is on the same network
- Test printer with a self-test print
- Common ports: 9100, 9101, 9102

**Print Job Failed**
- Check printer is powered on
- Verify network connectivity
- Try pinging the printer IP
- Check printer has paper loaded

## Environment Variables

### Print Server
Create `.env` file in `print-server/`:
```
BACKEND_URL=http://localhost:5000
```

### Backend
Backend runs on port 5000 by default. To change:
```
PORT=5000
```

## Printer Compatibility

This system works with:
- ESC/POS compatible thermal printers
- Network-connected (Ethernet/WiFi) printers
- Common brands: Epson, Star, Citizen, Bixolon

## Features

### Automatic Receipt Formatting
- Restaurant name and header
- Date and time
- Table number
- Itemized list with quantities and prices
- Subtotal, discounts, service charges
- Grand total
- Paper cut command

### Retry Mechanism
- Failed prints are retried up to 3 times
- 2-second delay between retries
- Status updates sent to backend

### Multiple Printers
- Register multiple printers
- Only one can be active at a time
- Easy switching between printers

## Testing

### Test Print Server Connection
1. Start backend: `npm start` in backend folder
2. Start print server: `npm start` in print-server folder
3. Look for: "✅ Connected to cloud backend"

### Test Printer Registration
1. Open POS system
2. Go to Printers tab
3. Add a test printer with fake IP (e.g., 192.168.1.999)
4. Should save successfully

### Test Full Flow
1. Create an order on a table
2. Go to Billing page
3. Select the table
4. Apply discounts/service charge if needed
5. Click "Finish Bill & Close Order"
6. Check print server logs for print job
7. Receipt should print automatically

## Notes

- Printing is **non-blocking** - bills are saved even if printing fails
- Print failures are logged but don't prevent bill completion
- Only active printers receive print jobs
- Print server must be running for automatic printing
- Multiple print servers can connect (but only one recommended)

## Support

For issues:
1. Check backend logs
2. Check print server logs
3. Check frontend console
4. Verify network connectivity
5. Test printer with manufacturer tools
