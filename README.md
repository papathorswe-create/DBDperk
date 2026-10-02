# DBDperk / Perkele

Public Dead by Daylight perk roulette by PapaThorSwe.

## Current features

- Survivor / Killer selection
- Searchable perk checklists
- Saved perk ownership selections using browser localStorage
- Configurable NO PERK chance
- Generated OBS Browser Source URL
- Dedicated transparent OBS overlay
- Robust cycling-style perk roulette animation
- Staggered slot stops
- Fourth-slot betrayal fake-out
- Automatic result text
- Automatic hide after result display
- Perk selection encoded into the URL
- No account, database, or paid backend required

## OBS usage

1. Open the main Perkele page.
2. Choose Survivor or Killer.
3. Select the perks you own.
4. Set the NO PERK chance.
5. Click GENERATE OBS URL.
6. Copy the URL.
7. Add it to OBS as a Browser Source.
8. Refresh that Browser Source whenever you want a new roll.

## Version 3.1

v3.1 replaces the fragile reel-position animation from v3 with a safer
image-cycling animation. The visual result still behaves like a roulette,
but no longer depends on measuring and translating a long reel track.

It also shows a visible PERKELE ERROR state if the overlay fails, making
future debugging much easier.
