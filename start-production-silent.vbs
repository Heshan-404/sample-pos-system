Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this VBS script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Show initial message
WshShell.Popup "Starting POS System..." & vbCrLf & vbCrLf & _
              "This may take 20-30 seconds." & vbCrLf & _
              "Please wait...", _
              3, "POS System", 64

' Step 1: Kill existing Node processes
WshShell.Run "taskkill /F /IM node.exe /T", 0, True
WScript.Sleep 2000

' Step 2: Build frontend
WshShell.CurrentDirectory = scriptDir & "\frontend"
WshShell.Run "cmd /c npm run build", 0, True
WScript.Sleep 2000

' Step 3: Start Backend Server
WshShell.CurrentDirectory = scriptDir & "\backend"
WshShell.Run "cmd /c start /min """" npm start", 0, False
WScript.Sleep 5000

' Step 4: Start Print Server
WshShell.CurrentDirectory = scriptDir & "\print-server"
WshShell.Run "cmd /c start /min """" npm start", 0, False
WScript.Sleep 4000

' Step 5: Open browser
WshShell.Run "http://localhost:5000", 1, False

' Show success message
WshShell.Popup "✓ POS System is now running!" & vbCrLf & vbCrLf & _
              "Dashboard: http://localhost:5000" & vbCrLf & _
              "Backend API: http://localhost:5000/api" & vbCrLf & vbCrLf & _
              "Browser has been opened automatically." & vbCrLf & vbCrLf & _
              "To stop servers, run: stop-pos-system.vbs", _
              10, "POS System Ready", 64

Set WshShell = Nothing
Set fso = Nothing
