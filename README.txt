PERKELE WEB STARTER
===================

This is the first standalone web version of Perkele.

Included:
- Survivor / Killer selector
- Searchable perk list
- Individual perk checkboxes
- Select All / Clear All
- Browser-local saved selections
- Basic 4-perk roll
- Separate survivor and killer TXT data files

IMPORTANT:
Because the app fetches the TXT files, most browsers will block it if you simply
double-click index.html and open it as file://.

Easiest local test on Windows:
1. Open this folder in Command Prompt.
2. Run:
   python -m http.server 8080
3. Open:
   http://localhost:8080

If Python is not installed, this can also be tested through GitHub Pages once
we upload it there.

NEXT STEP:
Connect this control panel to the full animated Perkele overlay and create a
dedicated OBS browser-source page.
