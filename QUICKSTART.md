# 🚀 POS System - Quick Start Guide

## 📁 Folder Structure

```
samplePOS/
├── backend/              # Backend API server (Node.js + Express)
│   ├── controllers/      # Business logic
│   ├── routes/          # API routes
│   ├── services/        # Service layer
│   ├── db/              # Database (SQLite)
│   └── server.js        # Main server file
│
├── frontend/            # Frontend React app (Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API integration
│   └── dist/           # Production build (created by build)
│
├── print-server/        # Local print server
│   └── index.js         # Printer communication
│
└── Startup Scripts:
    ├── start-production.bat          # Build & start (visible)
    ├── start-production-silent.vbs   # Build & start (hidden)
    ├── start-all-servers.bat         # Dev mode (visible)
    ├── start-pos-system.vbs          # Dev mode (hidden)
    └── stop-all-servers.bat          # Stop all servers
```

## 🎯 Which Script to Use?

### **PRODUCTION (Recommended for Daily Use):**

**Option 1: Visible** - `start-production.bat`
- ✅ Builds optimized frontend
- ✅ Serves from port 5000 only
- ✅ Kills old processes
- ✅ Opens browser automatically
- ✅ Shows progress in terminal

**Option 2: Silent** - `start-production-silent.vbs`
- ✅ Same as above but completely silent
- ✅ Only shows popup notifications
- ✅ Best for daily use

### **DEVELOPMENT (For coding/testing):**

**Option 1: Visible** - `start-all-servers.bat`
- ✅ Runs dev server (hot reload)
- ✅ Frontend on port 5173
- ✅ Backend on port 5000
- ✅ 3 terminal windows with logs
- ✅ Opens browser automatically

**Option 2: Hidden** - `start-pos-system.vbs`
- ✅ Same as above but hidden
- ✅ Good for quick testing

## 📝 What Each Script Does

### Production Mode (`start-production.bat` or `.vbs`):
1. ✅ Kills any Node.js processes on ports 5000
2. ✅ Builds optimized frontend (`npm run build`)
3. ✅ Starts backend server (serves frontend + API)
4. ✅ Starts print server
5. ✅ Opens http://localhost:5000 in browser

**Result:** Single port (5000), optimized, production-ready

### Development Mode (`start-all-servers.bat`):
1. ✅ Kills any existing Node.js processes
2. ✅ Starts backend server (port 5000)
3. ✅ Starts print server
4. ✅ Starts frontend dev server (port 5173, hot reload)
5. ✅ Opens http://localhost:5173 in browser

**Result:** Two ports, live reload, dev tools

## 🛑 Stopping Servers

**Quick Stop:** `stop-all-servers.bat` or `stop-pos-system.vbs`
- Kills all Node.js processes

**Manual Stop:**
- Close terminal windows (dev mode only)
- Or: Task Manager → End "node.exe" processes

## ⚡ Recommended Setup

### For Daily Use:
1. Create desktop shortcut to `start-production-silent.vbs`
2. Rename to "🚀 Start POS"
3. Double-click to start system
4. Browser opens automatically
5. Use `stop-pos-system.vbs` when done

### For Development:
1. Use `start-all-servers.bat`
2. Keep terminals open to see logs
3. Make changes → auto-reload
4. Stop by closing terminals

## 🔍 Port Information

| Environment | Frontend | Backend | Total Ports |
|------------|----------|---------|-------------|
| Production | 5000 | 5000 | 1 |
| Development | 5173 | 5000 | 2 |

## 📌 Important Notes

- **First time:** Run `npm install` in each folder
- **Port in use:** Scripts automatically kill old processes
- **Browser:** Opens automatically after startup
- **Production:** Frontend served from backend (single port)
- **Development:** Separate frontend server (hot reload)

## 🎯 Auto-Start on Windows Boot

1. Press `Win + R`
2. Type: `shell:startup`
3. Copy `start-production-silent.vbs` to that folder
4. System starts automatically on login

## 📱 Accessing from Other Devices

Replace `localhost` with your computer's IP address:
- Production: `http://192.168.1.100:5000`
- Development: `http://192.168.1.100:5173`

To find your IP: Run `ipconfig` in command prompt

## 🆘 Troubleshooting

**Servers won't start:**
- Check if Node.js is installed: `node --version`
- Run `npm install` in each folder

**Browser doesn't open:**
- Wait 10-15 seconds
- Manually open http://localhost:5000 (production)
- Or http://localhost:5173 (development)

**Port already in use:**
- Scripts automatically kill processes
- Or manually stop with `stop-all-servers.bat`

**Frontend build fails:**
- `cd frontend`
- `npm install`
- Try again
