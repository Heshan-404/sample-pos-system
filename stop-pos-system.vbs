Set WshShell = CreateObject("WScript.Shell")

' Kill all node.exe processes
WshShell.Run "taskkill /F /IM node.exe /T", 0, True

' Show notification
WshShell.Popup "POS System servers have been stopped." & vbCrLf & vbCrLf & _
              "All Node.js processes terminated.", _
              5, "POS System Stopped", 64

Set WshShell = Nothing
