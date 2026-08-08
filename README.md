# BinPress — Marketing-Website (überarbeitet 08.08.2026)

Statische One-Page-Website für das HFTM-Projekt **BinPress**.
Die Inhalte werden laufend mit den Unterlagen aus der bereitgestellten Projekt-ZIP abgeglichen.

## Live

**https://milos-hftm.github.io/binpress-website/**

(sobald GitHub Pages im Repo aktiviert ist — Settings → Pages → main → /root)

## Was am 08.08.2026 dazugekommen ist

- neue Spec-Karte **Vorschubgeschwindigkeit (11 mm/s)** und Zykluszeit-Schätzung (ca. 30–60 s) aus Hub/Vorschub ergänzt, Quelle: Machbarkeitsanalyse
- Funktionsablauf präzisiert: Gewindespindel + Führungsstreben, Status-Display, korrekter Auswurf am Ende des Vorwegs (nicht beim Rückhub)
- Sicherheitsbereich erweitert: 6 statt 4 Massnahmen, die 5 Startbedingungen der Steuerung, erlaubte/nicht erlaubte Abfälle, Hinweis auf Restrisiken
- neue Sektion **„Vision"**: früher App-Konzept (Dashboard, Füllstände, Historie, Simulator) als klar gekennzeichneter Ausblick — nicht Teil des aktuellen Prototyps oder Marketingkonzepts
- Assembly-STEP-Datei und weiteres Videomaterial sind im Projektarchiv vorhanden für ein späteres Produktvideo (noch nicht erstellt)

## Was vorher geändert wurde

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
    ├── app-konzept.jpg
    └── cad-making-of.mp4
```

## Geplant: Produktvideo

Ein KI-generiertes Produktvideo zu BinPress ist als nächster Schritt vorgesehen, ist aber noch nicht erstellt. CAD-Daten (inkl. Gesamtbaugruppe als STEP-Datei), technische Zeichnungen und reales Projektvideomaterial liegen im Projektarchiv bereit und können dafür als Grundlage dienen.

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
