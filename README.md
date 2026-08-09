# BinPress — Marketing-Website (überarbeitet 08.08.2026)

Statische One-Page-Website für das HFTM-Projekt **BinPress**.
Die Inhalte werden laufend mit den Unterlagen aus der bereitgestellten Projekt-ZIP abgeglichen.

## Live

**https://milos-hftm.github.io/binpress/**

Gehostet über GitHub Pages (Branch `main`, Root). Die frühere Adresse
`…/binpress-website/` ist nach der Repo-Umbenennung **nicht** mehr erreichbar —
GitHub leitet Repository-URLs weiter, Pages-URLs nicht.

## Bildnachweis / KI-Deklaration

Die Produktdarstellungen im Abschnitt **Ausblick** sowie das Hero-Bild sind **KI-generierte Designvisualisierungen** eines möglichen Serienprodukts. Sie zeigen kein gebautes Gerät. Auf der Website sind sie mit dem Label „KI-Visualisierung" gekennzeichnet, entsprechend der HFTM-Richtlinie „KI an der hftm einsetzen (Studierende)", Kapitel 1.4 Transparenz.

Die Zusammenstellungszeichnung (10013869) und das CAD-Making-of-Video stammen unverändert aus der Projektarbeit.

Die früheren Werkstattfotos des Prototyps wurden entfernt: es waren Standbilder aus einem Handyvideo (unscharf, überbelichtet, Hände im Bild) und in dieser Qualität für eine Produktseite nicht brauchbar. Sobald es saubere Aufnahmen des montierten Prototyps gibt, gehören sie in den Abschnitt **Projektstand**.

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
- Sicherheitsbereich ergänzt
- technische Daten in **Auslegung / Ziel / Anforderung / Test offen** getrennt
- Projektstatus korrigiert: Montage und praktische Tests sind noch ausstehend
- Materialkosten korrekt als Materialkosten bezeichnet (CHF 952.67; CHF 1'095.57 inkl. Reserve)
- Verkaufspreis: kalkulierte CHF 956 (Wirtschaftlichkeitsberechnung vom 07.08.2026, 100 Stück) und das Marktziel CHF 299–399 aus dem Marketingkonzept werden nebeneinander ausgewiesen, inklusive vollständiger Kostenaufschlüsselung
- Teamrollen nur dort konkret benannt, wo sie in den aktuellen Unterlagen eindeutig sind
- mobile Navigation und Responsive Layout überarbeitet
- Pressplatten-Animation technisch korrigiert

## Dateien

```text
binpress/
├── index.html
├── style.css
├── script.js
├── viewer.js                    (3D-Viewer, WebGL, ohne Fremdbibliothek)
├── README.md
└── assets/
    ├── hftm_logo.webp
    ├── cad_poster.webp
    ├── app-konzept.jpg
    ├── vision-hero.jpg          (KI-generiert)
    ├── vision-kitchen.jpg       (KI-generiert)
    ├── vision-detail.jpg        (KI-generiert)
    ├── vision-brand.jpg         (KI-generiert)
    ├── zusammenstellung.jpg
    ├── cad-making-of.mp4
    ├── binpress.bin             (Geometrie, 459 KB)
    └── binpress.json            (Teile-Metadaten)
```

## 3D-Modell

Der Abschnitt **Aufbau** zeigt die Gesamtbaugruppe als drehbares 3D-Modell.
Quelle ist die unveränderte CAD-Datei `10013869_A_1-Bin Press.stp` aus dem
Projektarchiv, tesselliert mit OpenCascade (`occt-import-js`) und in ein
kompaktes Binärformat gepackt: 34 Körper, 22'590 Dreiecke, 459 KB.

Die Teilenummern aus der STEP-Datei stimmen mit der Stückliste der
Zusammenstellungszeichnung überein, deshalb sind Modell und Stückliste
gekoppelt — ein Klick im Modell markiert die Position in der Liste und
umgekehrt.

**20 der 26 Positionen** haben einen 3D-Körper. Die Positionen 12–14 und
16–18 (kleine Scharniere, Lager) sind in der CAD-Baugruppe nicht als
Volumenkörper enthalten; sie erscheinen deshalb nur in der Stückliste.
Dieselben sechs Positionen sind auch in der Explosionszeichnung nicht
einzeln beziffert.

Der Viewer nutzt WebGL 1 ohne externe Bibliothek. Fehlt WebGL, blendet die
Seite einen Hinweis ein und die Explosionszeichnung bleibt über den
Umschalter erreichbar.

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
