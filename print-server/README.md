# Print Server - Local LAN Component

Node.js application that runs on the local restaurant network and communicates with printers via TCP.

## Installation

```bash
npm install
```

## Running

```bash
# Default (connects to localhost:3001)
npm start

# Connect to remote backend
BACKEND_URL=http://your-cloud-server.com:3001 npm start
```

## Features

✅ WebSocket connection to cloud backend  
✅ Receives print jobs in real-time  
✅ Prints to LAN printers via raw TCP  
✅ Automatic retry on failure (max 3 attempts)  
✅ Queue-based processing  
✅ Status reporting back to backend  

## How It Works

1. Connects to backend via WebSocket
2. Listens for `print-job` events
3. Opens TCP connection to printer IP:PORT
4. Sends raw print content
5. Reports status back to backend

## Configuration

Environment variables:
- `BACKEND_URL` - Backend server URL (default: http://localhost:3001)

## Example Print Job Format

```javascript
{
  jobId: "uuid",
  printer: {
    id: "uuid",
    name: "Kitchen Printer",
    ip: "192.168.1.50",
    port: 9100
  },
  content: "Hello World!"
}
```

## Troubleshooting

**Can't connect to printer:**
- Verify printer IP and port
- Check network connectivity
- Ensure printer is on the same LAN

**WebSocket disconnects:**
- Check backend server status
- Verify BACKEND_URL is correct
- Check firewall settings
