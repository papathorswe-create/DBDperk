# DBDperk / Perkele

A small Dead by Daylight perk roulette I made for stream.

The idea is simple:
pick Survivor or Killer, select the perks you actually own, then let Perkele decide the build.

There is also an OBS version, so streamers can generate a browser source and use it directly on stream.

## What it does

- Survivor / Killer perk pools
- Search and perk checkboxes
- Remembers your selected perks in the browser
- Adjustable NO PERK chance
- Generates an OBS browser source URL
- Random 4 perk loadout
- Staggered rolls
- Fourth slot betrayal fake-out
- Auto hides after showing the result

No login, database or backend needed.

## OBS

1. Pick Survivor or Killer.
2. Select the perks you own.
3. Set the NO PERK chance.
4. Generate the OBS URL.
5. Add that URL as a Browser Source.
6. Refresh the browser source whenever you want a new roll.

Perk images are currently loaded from papathorswe.se.

Made by PapaThorSwe.


## Perk list updates

The app first tries to load the perk lists from:

- https://papathorswe.se/perks/survivor-perks.txt
- https://papathorswe.se/perks/killer-perks.txt

If those cannot be reached, it falls back to the copies in the GitHub repo.

So normally, adding new perks to the two TXT files on papathorswe.se is enough.
The Available perk count updates automatically from however many lines are in the list.


## TRUE Killer Chaos

Same GitHub Pages project, new mode. Users can select owned Killers with portraits, reuse their saved Killer perk pool, roll a random Killer, four random perks and two valid add-ons, with independent NO PERK and NO ADD-ON chances. The OBS URL encodes the selected Killers, perk pool and both loss chances. Add-on images load from `https://papathorswe.se/killer-addons/<killer>/<addon>.png`.


## Character perk manager (v4.1)

The normal individual perk checklist is still the source of truth.

An optional collapsible **Manage perks by character** panel now sits above it:

- Separate character search bar
- Survivor/Killer character cards with portraits
- Clicking a character enables/disables that character's three unique perks
- Character cards show Full / Partial / Off based on the actual perk checkboxes
- Manual individual perk changes still work exactly as before
- Partial state means the user has manually enabled only some of a character's perks
- Enable all / Disable all acts only on the currently visible character search results
- Character data is stored in `data/character-perks.json`

This makes character ownership a shortcut, not a replacement for individual perk control.


## v4.2 Aurora / Judgment fix

Aurora Stardotter and The Judgment were present in the character mapping,
but their six new unique perks were missing from the perk TXT files used by
the roulette. That made the character manager unable to connect them to an
active perk pool.

v4.2 fixes this in two ways:

- Adds Aurora's and Judgment's perks to the bundled fallback TXT files.
- Merges mapped character perks into the loaded pool at runtime, so a stale
  hosted TXT file will not hide a newly mapped character's perks.

For clean maintenance, also add these lines to the hosted TXT files on
papathorswe.se:

Survivor:
Boon: Steadfast
Fruits of Your Labor
Salvation's Cry

Killer:
Celestial Witness
Hex: Under Your Thumb
Lay Waste


## v4.3 - Domain-first live game data

Perkele now loads live game data from `papathorswe.se` first and uses the
GitHub copies only as fallbacks.

Domain-first files:

- `https://papathorswe.se/perks/survivor-perks.txt`
- `https://papathorswe.se/perks/killer-perks.txt`
- `https://papathorswe.se/perks/character-perks.json`
- `https://papathorswe.se/perks/killers.json`
- `https://papathorswe.se/perks/killer-addons.json`

A `SERVER-DATA-UPLOAD` folder is included with the three JSON files ready
to upload to `/perks/` on papathorswe.se.


## v4.4 - Ghoul perk duplicate fix

Removed the legacy duplicate `Nothing But Misery`.

The only valid entry is now:

`Hex: Nothing but Misery`

Also update the live domain file:

`https://papathorswe.se/perks/killer-perks.txt`

Remove:
`Nothing But Misery`

Keep:
`Hex: Nothing but Misery`


## v4.5 - Fixed OBS overlay ratio

Both OBS overlays now use a fixed 1280×720 (16:9) design canvas.

The canvas scales uniformly to fit whatever Browser Source size OBS is using.
For example, the default 800×800 Browser Source will show the widget at
800×450 centered inside the source instead of triggering a different mobile
layout.

This also removes the old viewport breakpoint that changed the perk layout
from four columns to two columns when the Browser Source width dropped below
900px.

Recommended OBS Browser Source size is still 1280×720 or 1920×1080, but the
widget now keeps the same layout and aspect ratio even if a streamer leaves
OBS at its default 800×800.
