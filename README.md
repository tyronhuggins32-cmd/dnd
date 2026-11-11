# VARETHIA — Website

A responsive, single-page dark-fantasy website for the Varethia world concept.

## Open locally
Open `index.html` in a modern browser. No build step or package installation is required.

## Publish with GitHub Pages
1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then Save.
4. GitHub will provide the published website URL after deployment completes.

## Website sections
- Cinematic landing page and animated 2.5D-inspired castle atmosphere.
- World overview: 9 continents and 83 kingdoms.
- Element rarity ledger and elemental inheritance rules.
- Six curse categories.
- Spellcraft, ritual stages and miscast consequences.
- Independent NPC profiles and autonomy.
- Factions and the near-impossible godhood threshold.
- Varethian calendar.
- Brutal realism and persistent consequences.
- Visual production standard: 2.5D presentation everywhere except fully 3D architecture.
- Animation/VFX specification and full RPG HUD preview.
- Character creation draft modal. Drafts are stored locally in the visitor's browser; saving does not start a campaign.

## Visual and simulation scope
This is a responsive world website and front-end concept showcase, not a completed game engine. The CSS castle is a visual illustration, not an actual 3D model. Production 3D buildings, character rigs, game simulation, accounts, multiplayer, server persistence and generated animation assets remain separate development tasks.

## Canonical world design
See [WORLD_BIBLE.md](WORLD_BIBLE.md) for the full setting rules and production direction.


## Three.js character animation pipeline

The original HTML/CSS/JavaScript GitHub Pages structure remains in place. `animation.js` adds a Three.js rendering layer after the existing game scripts.

- Animated 3D previews for collection cards and inspected characters.
- The same model source is reused for hand cards, five-lane fighters and commanders.
- GLB loading through GLTFLoader, with reusable animation clips and shared model caching.
- Procedural humanoid and creature test rigs when no GLB has been assigned.
- Idle, walk/run, deploy jump, melee attack, block, dodge, hit and death states.
- Elemental ambient particles, impact flashes, projectile trails, ultimate bursts, camera shake and synthesized combat sound cues.
- Intersection-based lazy loading, offscreen render pausing, capped pixel ratio and disposal when UI cards are replaced.

See `assets/characters/README.md` for adding production GLB assets. The initial project includes a procedural test character; individual production GLB files still need to be supplied and mapped in the asset manifest.
