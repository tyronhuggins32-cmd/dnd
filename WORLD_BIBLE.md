# VARETHIA — WORLD BIBLE

## Premise
Varethia is a vast dark-fantasy world in which elemental gifts and curses shape everyday life, politics, warfare, class, religion and personal ambition. Power attracts opportunity and danger. There is no guaranteed victory and no plot armor.

## World scale
- 9 major continents.
- 83 recognized kingdoms.
- Independent settlements, frontier territories and city-states.
- Ancient civilizations and buried ruins.
- Magical forests, oceans, deserts, mountains and cursed territories.

## Elemental laws
The world contains over 1,000 documented element types. The concept's initial classification ledger is:
- Common: 400
- Uncommon: 250
- Rare: 180
- Extremely rare: 100
- Legendary: 50
- Mythical: 19
These listed buckets total 999; the world premise is **1,000+**, so the taxonomy intentionally leaves room for undiscovered, disputed or unclassified elements.

Ordinary people are born with one natural element. A person's element cannot normally be changed. Inheritance is probabilistic: children may inherit a parent's type or awaken a different one. Some gifts manifest late; some people never discover their ability. Rarity is not a direct measure of skill or combat outcome.

Example common elements: fire, water, earth, wind, ice, lightning, sand, wood, metal, smoke, mud, stone.
Example rare types: gravity, blood, shadow, sound, crystal, magnetism, poison, lava, bone, light.
Legendary and mythical types may include time, space, void, soul, dimension, celestial, destruction, creation, existence, infinity, oblivion, reality and origin. These are setting examples, not a complete catalogue.

## Curses
Curses are separate from elemental gifts. They may be inherited, inflicted, accidentally acquired, awakened or bound to an object/place.
Types:
- Beneficial: grant utility or unusual powers with a price.
- Hostile: damage the bearer or those around them.
- Dormant: activate after a trigger.
- Sentient: possess agency, memory or voice.
- Bloodline: pass through family lines.
- Ancient: originate in pre-modern beings or civilizations.

Curses are not automatically evil. Their moral impact depends on the curse, bearer, choices and consequences.

## Spellcraft
Spells are structured procedures, not casual wish fulfilment. They may require precise pronunciation, gestures, energy control, concentration, elemental knowledge, tools or materials. Advanced spells have genuine failure states: backlash, internal magical injury, loss of control, collateral damage, organ damage or death. A failed attempt should not always kill the caster, but catastrophic failure must remain possible and clearly foreshadowed where appropriate.

## Power and society
Power has a social cost. Kings may recruit gifted people; assassins may target them; institutions may study or exploit them; religious orders may condemn them; rivals may form coalitions. Some characters seek power above all else. Godlike ascension is theoretically possible but intended to be extraordinarily rare: the premise describes a 99.9% failure chance for attempts to reach godhood, not a guaranteed outcome.

## NPC autonomy
Every significant NPC has a name, age, goals, beliefs, personality, strengths, weaknesses, relationships, history, current location and ongoing plans. Not every NPC has a tragic history; most have ordinary, varied lives. A small minority have severe traumatic backstories. NPCs can form relationships, work, trade, train, lie, betray, move, fight, die and change their views without player involvement. They remember consequential interactions and may act on incomplete or false information.

## Factions
- Royal Houses: kingdoms, territory, succession and armies.
- Arcane Institute: study of elements, curses and forbidden spellcraft.
- Black Covenant: secret network collecting dangerous curses.
- Iron Order: elite hunters and containment specialists.
- Unbound: anti-establishment independents.
- Ascendants: individuals seeking apotheosis.

Factions have competing internal interests, leaders, resources, allies, rivals and histories. They should not exist solely to serve the player.

## Consequence model
Choices can change reputation, law enforcement attention, relationships, access, prices, political stability, physical condition and future events. Consequences may be delayed. Violence can create witnesses, vendettas and investigations. Mercy can create allies or future liabilities. Power displays can attract fear, recruitment attempts, exploitation or assassination. Deaths persist unless a rare, established resurrection method is used.

## Brutal realism
Track injury, fatigue, infection, hunger, thirst, stress, magical exhaustion, recovery time and resource constraints where the simulation supports them. Combat results depend on experience, preparation, equipment, terrain, physical condition, information and chance. Powerful characters can make mistakes. NPCs can refuse, flee, deceive, bargain or attack according to their own motives.

## Varethian calendar
- 30 hours per day.
- 8 days per week.
- 40 days per month.
- 12 months per year.
- 480 days per year.
Months: Ashfall, Frostveil, Thornrise, Emberwake, Duskmere, Stormcall, Bloodmoon, Suncrest, Hollowtide, Ironreach, Starfall, Nightveil.

The prototype includes a preview clock only. Campaign time stays paused until explicit world entry.

## Visual production bible
**Global rendering rule: everything is presented in 2.5D except buildings, which are fully 3D.**
- Characters, NPCs, animals, monsters, weapons, props, vegetation, weather and magic: 2.5D sprites, layered rigs or 2.5D effects.
- Buildings, castles, houses, towers, bridges, dungeons and their interiors: fully 3D geometry.
- Use depth planes, parallax, perspective scaling, occlusion, atmospheric perspective and dynamic lighting to integrate both approaches.
- Camera: primarily side-view or angled 2.5D with cinematic depth movement; avoid flat UI-only presentation.

## Animation and VFX specification
Character motion: idle, breathing, locomotion, turning, gestures, combat anticipation, attack, recovery, dodge, block, stagger, knockdown, injury, death and contextual interactions.
Magic: charge-up, cast, projectile/travel, impact, lingering field, dissipate, interruption and miscast/backlash.
Environment: flag movement, fire, smoke, rain, lightning, drifting fog, foliage sway, water movement, debris and destructible set dressing where supported.
UI: title reveal, staggered menu entrance, focus glow, selection pulse, rune rotation, loading sigils, damage feedback, alerts and relationship change notifications.
Animation principles: anticipation, readable silhouettes, weight, follow-through, recovery, context-sensitive speed and injury-aware movement. Use animation state machines and event-driven VFX hooks in a production engine.

## Startup HUD
Dark medieval palette: charcoal/black, iron, muted silver, deep crimson, parchment and restrained gold.
Full RPG layout includes health, magic, status, injuries, calendar/time, relationship tracking and world event notifications. No character data is fabricated before character creation. The HUD should clearly show “NO CHARACTER SELECTED” until a character exists.

## Scope honesty
This document captures the design target. The web prototype demonstrates an animated menu/HUD presentation only; it does not implement the full simulation or actual 3D building assets.
