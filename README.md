# DBDperk / Perkele

Public Dead by Daylight perk roulette by PapaThorSwe.

## Current features

- Survivor / Killer selection
- Searchable perk checklists
- Saved perk ownership selections using browser localStorage
- Configurable NO PERK chance
- Generated OBS Browser Source URL
- OBS overlay automatically rolls on page load / refresh
- Perk selection is encoded into the URL, so no account or database is required

## GitHub Pages

Publish from:
- Branch: main
- Folder: / (root)

## OBS usage

1. Open the main Perkele page.
2. Choose Survivor or Killer.
3. Select the perks you own.
4. Set the NO PERK chance.
5. Click GENERATE OBS URL.
6. Copy the URL.
7. Add it to OBS as a Browser Source.
8. Refresh that Browser Source whenever you want a new roll.

## Files

- index.html – setup/control page
- style.css – setup page styling
- app.js – setup page logic
- overlay.html – OBS browser source
- overlay.css – overlay styling
- overlay.js – roulette logic
- data/survivor-perks.txt
- data/killer-perks.txt

## Note

Perk images are currently loaded from papathorswe.se.
A later version can move those images into the GitHub repository too.
