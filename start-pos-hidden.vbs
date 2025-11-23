Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this VBS script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Change to project directory
WshShell.CurrentDirectory = scriptDir

' Start Backend Server (hidden)
WshShell.Run "cmd /c cd /d """ & scriptDir & "\backend"" && start /min npm start", 0, False
WScript.Sleep 3000

' Start Print Server (hidden)
WshShell.Run "cmd /c cd /d """ & scriptDir & "\print-server"" && start /min npm start", 0, False
WScript.Sleep 3000

' Start Frontend Server (hidden)
WshShell.Run "cmd /c cd /d """ & scriptDir & "\frontend"" && start /min npm start", 0, False

' Show notification
WshShell.Popup "POS System is now running!" & vbCrLf & vbCrLf & _
              "✓ Backend:  http://localhost:5000" & vbCrLf & _
              "✓ Print Server: Connected" & vbCrLf & _
              "✓ Frontend: http://localhost:5173" & vbCrLf & vbCrLf & _
              "All servers are running in the background." & vbCrLf & _
              "To stop servers, use Task Manager (Ctrl+Shift+Esc)" & vbCrLf & _
              "and end all 'node.exe' processes.", _
              10, "POS System Started", 64

Set WshShell = Nothing
Set fso = Nothing
