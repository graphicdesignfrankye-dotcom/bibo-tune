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
