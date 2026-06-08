@echo off
REM SSH auto-login with password for Windows
REM Usage: auto_ssh.cmd "command to run"

set SSH_CMD=ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@8.209.222.69 %1

REM Create a VBS script to send password
echo Set WshShell = WScript.CreateObject("WScript.Shell") > %temp%\ssh_tmp.vbs
echo WshShell.Run "%SSH_CMD%", 1, FALSE >> %temp%\ssh_tmp.vbs
echo WScript.Sleep 3000 >> %temp%\ssh_tmp.vbs
echo WshShell.AppActivate "ssh.exe" >> %temp%\ssh_tmp.vbs
echo WScript.Sleep 500 >> %temp%\ssh_tmp.vbs
echo WshShell.SendKeys "Aaasdfghj0@{ENTER}" >> %temp%\ssh_tmp.vbs

start /wait cscript //nologo %temp%\ssh_tmp.vbs
del %temp%\ssh_tmp.vbs 2>nul
