# POS System - Startup Scripts Guide

## 📋 Available Scripts

### 🚀 Starting the System

#### **Option 1: With Visible Terminals** (Recommended for Development)
**File:** `start-all-servers.bat`
- Double-click to run
- Opens 3 terminal windows (Backend, Print Server, Frontend)
- Shows all server logs
- Easy to see what's happening

#### **Option 2: With Hidden Terminals** (Silent)
**File:** `start-pos-system.vbs`
- Double-click to run
- Runs batch file in background
- Shows popup notification when started
- Terminals are hidden but processes run

#### **Option 3: Completely Hidden** (Production)
**File:** `start-pos-hidden.vbs`
- Double-click to run
- All servers run completely in background
- No terminal windows visible
- Shows popup notification only
- Best for production/daily use

### 🛑 Stopping the System

#### **Option 1: With Terminal** (Visible)
**File:** `stop-all-servers.bat`
- Double-click to run
- Shows confirmation in terminal
- Stops all Node.js processes

#### **Option 2: Silent Stop**
**File:** `stop-pos-system.vbs`
- Double-click to run
- Silently stops all servers
- Shows popup notification when stopped

## 🔧 What Gets Started

All startup scripts launch these 3 servers:

1. **Backend Server** → `http://localhost:5000`
   - REST API
   - Database
   - WebSocket for printer communication

2. **Print Server** → Connects to backend
   - Local printer management
   - Thermal printer communication

3. **Frontend Server** → `http://localhost:5173`
   - React application
   - User interface

## 📝 Usage Instructions

### For Daily Use (Production):
1. **Start:** Double-click `start-pos-hidden.vbs`
2. Wait for popup notification (5-10 seconds)
3. Open browser to `http://localhost:5173`
4. **Stop:** Double-click `stop-pos-system.vbs` when done

### For Development:
1. **Start:** Double-click `start-all-servers.bat`
2. Keep terminals open to see logs
3. **Stop:** Close terminal windows or run `stop-all-servers.bat`

## ⚠️ Important Notes

- **First Time Setup:** Run `npm install` in each folder before using scripts:
  ```
  cd backend && npm install
  cd print-server && npm install
  cd frontend && npm install
  ```

- **Stopping Servers:** Hidden servers must be stopped using:
  - `stop-pos-system.vbs` or `stop-all-servers.bat`
  - Task Manager → End all "node.exe" processes

- **Port Already in Use:** If you get port errors, stop all servers first

- **Windows Defender:** May ask for permission first time - click "Allow"

## 🎯 Recommended Setup

### Create Desktop Shortcuts:
1. Right-click `start-pos-hidden.vbs` → Send to → Desktop (create shortcut)
2. Right-click `stop-pos-system.vbs` → Send to → Desktop (create shortcut)
3. Rename shortcuts to "Start POS" and "Stop POS"
4. Change icons if desired (right-click → Properties → Change Icon)

### Auto-Start on Windows Boot:
1. Press `Win + R`
2. Type: `shell:startup`
3. Copy `start-pos-hidden.vbs` to this folder
4. POS system will start automatically on login

## 🔍 Troubleshooting

**Servers won't start:**
- Check if Node.js is installed: `node --version`
- Run `npm install` in all folders first
- Check if ports 5000 and 5173 are available

**Can't stop servers:**
- Use Task Manager (Ctrl+Shift+Esc)
- Go to Details tab
- End all "node.exe" processes

**Popup doesn't show:**
- Servers are still starting (wait 10 seconds)
- Check Task Manager for node.exe processes

## 📞 Support

For issues or questions, check the main README.md file.
