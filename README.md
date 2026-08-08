# BinPress — Marketing-Website (überarbeitet 07.08.2026)

Überarbeitete statische One-Page-Website für das HFTM-Projekt **BinPress**.
Die Inhalte wurden mit den Unterlagen aus der bereitgestellten Projekt-ZIP abgeglichen.

## Was geändert wurde

- stärkerer Marketing-Fokus statt reiner Projektdokumentation
- echter Prototyp prominent im Hero
- Zielgruppenbereich für Einpersonenhaushalte, WGs und Familien
- interaktive Vorher-/Nachher-Animation mit klarer Kennzeichnung als Ziel/Schemadarstellung
- echtes CAD-Making-of-Video aus dem Projektmaterial integriert und fürs Web komprimiert
- echte Prototypbilder aus dem Hauptdokument eingebunden
- Sicherheitsbereich ergänzt
- technische Daten in **Auslegung / Ziel / Anforderung / Test offen** getrennt
- Projektstatus korrigiert: Montage und praktische Tests sind noch ausstehend
- Materialkosten korrekt als Materialkosten bezeichnet (CHF 952.67; CHF 1'095.57 inkl. Reserve)
- Zielpreis CHF 299–399 klar als vorläufiger Serien-Zielwert gekennzeichnet
- Teamrollen nur dort konkret benannt, wo sie in den aktuellen Unterlagen eindeutig sind
- mobile Navigation und Responsive Layout überarbeitet
- Pressplatten-Animation technisch korrigiert

## Dateien

```text
BinPress-Website-Marketing/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── proto_full.webp
    ├── proto_open.webp
    ├── proto_detail.webp
    ├── proto_cover.webp
    ├── hftm_logo.webp
    ├── cad_poster.webp
    └── cad-making-of.mp4
```

## Lokal ansehen

`index.html` direkt im Browser öffnen. Für die zuverlässigsten Video-/Browserfunktionen kann der Ordner auch über einen kleinen lokalen Webserver gestartet werden.

Beispiel mit Python:

```bash
python -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen.

## GitHub Pages

1. Inhalt dieses Ordners in ein GitHub-Repository hochladen.
2. `index.html` muss im Root liegen.
3. **Settings → Pages → Deploy from a branch → main → /(root)** auswählen.

## Wichtig vor einer öffentlichen Markteinführung

Die Website kennzeichnet derzeit offene Versuchswerte bewusst als Ziele, Anforderungen oder noch zu testende Grössen. Sobald Montage und Prototypentests abgeschlossen sind, sollten insbesondere folgende Werte mit den tatsächlichen Messergebnissen aktualisiert werden:

- Volumenreduktion
- tatsächlich benötigte Presskraft
- Zyklusdauer
- Geräuschpegel
- praktische Kompatibilität mit Behältern/Sackgrössen
- Sicherheitsprüfungen

Für einen echten Lead-/Interessentenprozess sollte später zusätzlich ein Formular-Backend bzw. ein verbindlicher Kontaktkanal ergänzt werden. Das wurde nicht erfunden, weil in den bereitgestellten Unterlagen kein eindeutiger öffentlicher Empfänger für die Website angegeben ist.
