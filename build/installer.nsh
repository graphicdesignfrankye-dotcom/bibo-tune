; Prima di partire: installazione normale o versione portatile.
; Portatile = i file vengono copiati nella cartella scelta, senza collegamenti,
; senza voce in "App e funzionalità" e senza programma di disinstallazione.
!include LogicLib.nsh

!ifndef BUILD_UNINSTALLER
Var PortableMode
!endif

; La domanda arriva subito all'avvio (customInit), prima di tutte le pagine.
!macro customInit
  StrCpy $PortableMode "0"
  ${IfNot} ${Silent}
  ${AndIfNot} ${UAC_IsInnerInstance}
    MessageBox MB_YESNO|MB_ICONQUESTION "Come vuoi usare Bibo Tune?$\r$\n$\r$\nSì = INSTALLATA (consigliata): collegamenti nel menu Start e sul desktop, si disinstalla da Windows.$\r$\nNo = PORTATILE: copia solo i file in una cartella, senza installare nulla (utile per una chiavetta)." IDYES +2
    StrCpy $PortableMode "1"
  ${EndIf}
!macroend

!macro customInstall
  ; Chi ha installato una versione vecchia ha un collegamento chiamato "Electron" (e il nome ricordato nel registro):
  ; si toglie, si scrive il nome giusto e si creano i collegamenti "Bibo Tune".
  WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" ShortcutName "Bibo Tune"
  Delete "$SMPROGRAMS\Electron.lnk"
  Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Electron.lnk"
  Delete "$DESKTOP\Electron.lnk"
  ${If} $PortableMode != "1"
    CreateShortCut "$SMPROGRAMS\Bibo Tune.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "${APP_DESCRIPTION}"
    WinShell::SetLnkAUMI "$SMPROGRAMS\Bibo Tune.lnk" "${APP_ID}"
    StrCpy $launchLink "$SMPROGRAMS\Bibo Tune.lnk"
  ${EndIf}
  ; Nome nel Pannello di controllo: solo "Bibo Tune" (la versione sta già nella colonna Versione).
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" DisplayName "Bibo Tune"
  ; Windows ricorda il nome mostrato la prima volta che ha visto il programma (finora "Electron"):
  ; si toglie dalla memoria, così alla prossima apertura legge quello nuovo.
  DeleteRegValue HKCU "Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\MuiCache" "$INSTDIR\${APP_EXECUTABLE_FILENAME}.FriendlyAppName"
  DeleteRegValue HKCU "Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\MuiCache" "$INSTDIR\${APP_EXECUTABLE_FILENAME}.ApplicationCompany"
  ${If} $PortableMode == "1"
    Delete "$newStartMenuLink"
    Delete "$newDesktopLink"
    DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
    Delete "$INSTDIR\${UNINSTALL_FILENAME}"
    FileOpen $0 "$INSTDIR\portable.txt" w
    FileWrite $0 "Versione portatile di Bibo Tune: per toglierla basta cancellare questa cartella.$\r$\n"
    FileClose $0
  ${EndIf}
!macroend
