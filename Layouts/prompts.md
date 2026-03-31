# DayScore – Prompts por Aba

---

## TODAY
**Arquivos:** hoje_atual.png + today.html

> "I'm attaching two files: a screenshot of my current Today tab, and an HTML reference mockup showing how I want it to look. Please update my Today tab to match the mockup. Specific changes: replace the large calendar with a compact 7-day week strip with small dots below each day indicating if tasks were done; replace the 3 stat cards with a score ring (SVG circle) on the left beside 3 mini stats (Planned, Done, Remaining) on the right inside a single card; reduce all font sizes to be more compact; add a floating + button (FAB) in the bottom right corner to add tasks. Keep all existing logic and localStorage unchanged."

---

## ROUTINE
**Arquivos:** routine_atual.png + routine.html

> "I'm attaching two files: a screenshot of my current Routine tab, and an HTML reference mockup. Please update my Routine tab to match the mockup. Specific changes: add a thin progress bar (3px height) above the weekday dots in each habit card; show the 5 weekday dots (M T W T F) as small filled circles — green if done, purple if today, gray if empty; remove the time display from each card; add a small streak tag '🔥 Xd' aligned to the right of the day dots; add a dashed 'Add new habit' row at the bottom. Keep all existing logic and localStorage unchanged."

---

## HISTORY
**Arquivos:** history_atual.png + history.html

> "I'm attaching two files: a screenshot of my current History tab, and an HTML reference mockup. Please update my History tab to match the mockup. Specific changes: add 3 summary stat cards at the very top (Avg score in purple, Active days in green, Streak in amber); fix the bar chart so bars actually render with real data from localStorage — today's bar should be purple/bold, best day green, low days amber; add a Mood this week section below the chart showing one emoji per day pulled from localStorage; add a Best Day card at the bottom with a dark navy-to-purple gradient background. Keep all existing logic."

---

## AWARDS
**Arquivos:** awards_atual.png + awards.html

> "I'm attaching two files: a screenshot of my current Awards tab, and an HTML reference mockup. Please update my Awards tab to match the mockup. Specific changes: replace the current streak card with a dark gradient card (navy to purple) showing the streak number large on the left with a flame emoji, and a progress bar showing % towards the next milestone; update achievement cards so each has a colored circular icon background even when locked — just set opacity: 0.4 for locked cards; add a thin progress bar inside each achievement card showing current progress. Keep all existing logic."

---

## SETTINGS (nova aba)
**Arquivo:** settings.html

> "Please add a Settings tab as the 5th item in the bottom navigation bar with a gear icon ⚙️. Use the attached HTML file as the exact visual reference. Build it with: a profile card at the top showing avatar with initials and a + badge to upload photo, user name, and 'tap to edit' subtitle; an Appearance section with dark mode toggle, accent color picker (4 color dots: purple, green, red, amber), and language selector; a Notifications section with a reminder toggle and time picker that only shows when toggle is on; a Data section with export (downloads JSON) and reset options (reset label in red, requires confirmation). Save all settings to localStorage and apply dark mode and accent color changes instantly across the whole app."

---

## DICA GERAL
Faça uma aba por vez. Após cada mudança, teste no celular antes de continuar.
Se algo quebrar, mande o erro e o print pro Claude Code com: "This broke after the last change, please fix it without changing anything else."
