# Varethia character animation assets

The browser animation layer is loaded by `animation.js` and uses Three.js plus GLTFLoader.

## Add a character model
1. Export a rigged character as `.glb` with materials and animation clips.
2. Place it in this folder or another same-origin assets folder.
3. Add its relative URL to `manifest.json` under `models`, keyed by species.
4. Recommended clip names: `Idle`, `Walk`, `Run`, `Attack`, `Block`, `Dodge`, `Hit`, `Death`.
5. Keep compatible humanoids on a shared skeleton. Use separate rigs for quadrupeds, dragons and other non-humanoids.

Until a GLB is assigned, the game uses an animated Three.js procedural test character. Card and battlefield views load from the same species/element asset cache with separate camera framing.

## Performance
- Cache model loads by species and element.
- Mount views only near the viewport.
- Stop rendering offscreen previews.
- Cap device pixel ratio and keep ambient particles low.
- Use compressed GLB textures and mesh compression for production assets.


## Per-character model overrides

You can map a specific character card ID to a unique GLB under the `characters` object in `manifest.json`. The numeric card ID overrides its species-level model. For example, card 1 can use `./assets/characters/ashen-warden.glb`. This allows the same individual GLB and skeleton to appear on its collection card, in the hand and on the battlefield.

The manifest currently contains no imported production GLBs. The built-in procedural test rig keeps the animation pipeline functional until those models are added.


## Optional LOD exports

A species or individual-card manifest entry may be a single GLB path or an object with `high` and `low` paths. Collection portraits load the high-detail version; battlefield units and commanders load the low-detail version. Both exports should use the same skeleton, bone names and animation clip names so the character remains visually consistent across contexts.
