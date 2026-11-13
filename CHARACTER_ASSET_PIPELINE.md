# Varethia character asset pipeline

## Target
Create two separately deliverable assets for every character ID (001–900):

1. **Card illustration** — an individual, high-quality 2D character illustration used in the collection card and dossier.
2. **Battle model** — a matching, rigged 3D character exported as GLB for the Three.js battlefield.

The art reference is not a 3D model. Never treat a 2D illustration as a substitute for a rigged GLB.

## Stable identity and file layout
Every asset is keyed by the existing numeric character ID. Do not key assets by display name because names may change.

- `assets/characters/card-art/0001.webp` … `0900.webp`
- `assets/characters/models/0001.glb` … `0900.glb`
- Optional lower-detail models: `assets/characters/models/0001.low.glb` … `0900.low.glb`
- Registry: `assets/characters/manifest.json`

The registry contains 900 entries. Each entry has `cardArt`, `model.high`, `model.low`, animation clip names, target paths and an asset status. Asset URL fields intentionally remain null until real files have been generated and committed. This prevents the game from requesting nonexistent files.

## Art direction
- Preserve each character's established name, species, element, rarity, stats and attacks.
- The card illustration and 3D model must depict the same character: same silhouette, face, skin/fur/scales, costume, armor, weapon, palette and signature elemental details.
- Character identity must be distinct; do not reuse one portrait/model for all characters.
- Card art: portrait composition, readable silhouette, clean subject separation, dramatic dark-fantasy lighting, no baked-in UI text, rarity badge or stat labels.
- Model: full body, centered origin, consistent forward direction, consistent scale convention, clean topology, PBR materials, suitable for a three-quarter camera.
- Keep the element recognizable through controlled VFX/material accents, not by replacing the whole character with a generic elemental effect.

## Animation contract
Each GLB should contain a usable skeleton and named clips. Standard clip names:
- `Idle` — looping breathing/stance.
- `Attack` — character-specific signature attack.
- `Hit` — short impact reaction.
- `Death` — defeat/fall animation.

Recommended additional clips: `Walk`, `Run`, `Block`, `Dodge`, `Cast`, `Ultimate`, `Victory`.
Use consistent rig naming and root orientation across the collection. The runtime maps clip names case-insensitively; update the manifest's `animationClips` when an asset uses different names.

## Production sequence
1. Finalize each character's visual brief from its existing game data.
2. Generate and approve the individual card-art reference.
3. Build the matching 3D model from that approved reference.
4. Rig, weight-paint and animate the model.
5. Export GLB and validate it in a standalone Three.js preview.
6. Add the committed file paths to that character's manifest entry.
7. Set its status to `art-ready`, `model-ready` or `complete` as appropriate.
8. Test card portrait, dossier preview and battlefield animation using the same character ID.

## Current implementation status
- 900 stable registry entries are prepared.
- Three.js already supports per-character GLB URLs and falls back to the existing procedural rig if no model URL is assigned.
- The runtime exposes the registry so the collection UI and asset tools can read character-specific paths.
- No finished individual illustrations or GLB models are included yet. The current procedural models are temporary visual fallbacks, not the final 900 unique assets.
