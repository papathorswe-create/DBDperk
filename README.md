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
