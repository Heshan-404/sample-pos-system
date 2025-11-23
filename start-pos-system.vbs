Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this VBS script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Path to the batch file
batFile = scriptDir & "\start-all-servers.bat"

' Run the batch file hidden (0 = hidden window)
WshShell.Run Chr(34) & batFile & Chr(34), 0, False

' Show a notification that servers are starting
WshShell.Popup "POS System servers are starting..." & vbCrLf & vbCrLf & _
              "Backend:  http://localhost:5000" & vbCrLf & _
              "Frontend: http://localhost:5173" & vbCrLf & vbCrLf & _
              "Servers will run in the background.", _
              5, "POS System", 64

Set WshShell = Nothing
Set fso = Nothing
