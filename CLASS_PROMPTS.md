# Nimble Quest — prompts per clasă (repair / skill pass)

Folosește **un prompt pe clasă**. Nu omite bullet-urile. Context: joc convoy Nimble Quest, canvas 2D, eroi în `heroes/*.js`, zone în `GroundZones`, status în `StatusEffects`, factory în `heroes.js`, UI skill tree în `SkillTree.js`.

---

## PROMPT — MAGE

Ești game engineer pe Nimble Quest. Repară **doar Mage** (`heroes/Mage.js`) fără să strici wiring-ul global.

### Basic (default attack)
- **Chain Lightning** este atacul normal, nu un skill rar.
- Lanț vizibil: bolt jagged (segmente) de la mage → țintă1 → țintă2 → … (până la 4 hops).
- Animație scurtă (~0.25–0.35s) cu flicker pe bolt; **nu** bile albastre random.
- Damage scade ușor pe hop. Cast CD ~1.3–1.5s (nu spam 1s).

### Skill
- **Meteor**: spawn **deasupra** țintei (marker pe sol), cade din cer, impact AoE.
- La impact lasă **foc pe jos** (GroundZone 2.5–3.5s) cu DOT.
- Nu e fireball homing din mâna mage-ului. CD ~2.0s.

### Ultimate
- **Blizzard**: zonă persistentă 4–5s, slow puternic + damage pe tick.
- Animație: cerc de gheață + particule/fulgi, nu buline care apar/dispar fără damage.
- Ultimate CD ≥ 18s. Disponibil de la party level 3 + unlock în skill tree.

### Skill tree
- Nodes: Chain Lightning (owned), Meteor (cost 1), Blizzard (cost 2).
- Unlock trebuie să schimbe `skillPool` / `ultimateSkill`.

### Acceptance
- Vizual clar diferențiat: chain ≠ meteor ≠ blizzard.
- Nicio bilă albastră generică ca basic.
- Smoke: pornește jocul ca Mage, vezi bolt chain pe primul pack, meteor lasă foc, blizzard slow-uiește.

---

## PROMPT — NECROMANCER

Repară **doar Necromancer** (`heroes/Necromancer.js`).

### Basic
- **Blood Wave**: val care **străbate** toți mobii (pierce).
- Nu se oprește animația/proiectilul în primul mob.
- Damage pe **fiecare** inamic intrat în val (hit set per enemy).
- Heal necro **procent din damage-ul dat** (ex. 25%); feedback floating `+HP`.
- CD ~1.5–1.7s.

### Skill
- **Decrepify** (nu „curse orb” generic):
  - Slow pe ținte din rază.
  - `damageTakenMult` crescut (primesc mai mult damage de la toți).
  - Poison DOT separat pe durată.
  - Vizu: undă violet/neagră din necro.

### Ultimate
- **Poison Nova** stil Diablo 2: inel de proiectile poison în toate direcțiile, aplică poison, pierce scurt.
- CD ≥ 18s.

### Skill tree
- Blood Wave owned, Decrepify cost 1, Poison Nova cost 2.

### Acceptance
- Blood wave trece prin 3+ mobi și heal-uiește.
- Decrepify face mobii lenți + mai fragili + DOT.
- Nova arată ca inel, nu ca spit random.

---

## PROMPT — DRUID

Repară **doar Druid** (`heroes/Druid.js`).

### Basic
- **Entangling Roots**: proiectil care root/slow-uiește la hit. CD ~1.4s.

### Skill
- **Hurricane**: plasează un **cerc** pe poziția țintei (sau înainte), rămâne **2–3s**.
- Vârtej vizual (arce rotative), damage pe tick, **atrage ușor** mobii spre centru.
- Nu e slash instant pe self. CD ~2.2s.

### Ultimate
- **Cataclysm**: crapă pământul în **linie dreaptă** pe aim.
- Pe linie rămâne foc/DOT câteva secunde (segmente GroundZone).
- CD ≥ 18s.

### Skill tree
- Roots owned, Hurricane cost 1, Cataclysm cost 2.

### Acceptance
- Hurricane se vede persistent și trage mobii.
- Cataclysm e linie pe jos cu foc, nu un singur blob.

---

## PROMPT — ROGUE

Repară **doar Rogue** (`heroes/Rogue.js`).

### Basic
- **Arrow Volley**: 3 săgeți în fan. CD ~1.0–1.1s.

### Skills
- **Penetrating Shot**: o săgeată care **pierce** multi-target. CD ~1.5s.
- **Shadow Step** (obligatoriu): blink pe direcție + **clonă vizuală** la poziția veche (sprite faded / dash outline) care durează ~1s și poate irita/damage ușor. Nu doar teleport fără feedback. CD ~2.4s.

### Ultimate
- **Frost Shot**: fan de săgeți de gheață + slow. CD ≥ 18s.

### Skill tree
- Volley owned; Penetrating + Shadow Step cost 1 each; Frost Shot cost 2.

### Acceptance
- Shadow step lasă clonă vizibilă.
- Pierce traversează ≥2 mobi.

---

## PROMPT — WARRIOR

Repară **doar Warrior** (`heroes/Warrior.js`).

### Basic
- **Whirlwind**: AoE circular în jurul warrior, arc rotativ vizual. CD ~1.2–1.3s.

### Skill
- **Shockwave**: undă crescent înainte, pierce. CD ~1.7s.

### Ultimate
- **Battle Shout**: buff party (cast/speed) + pulse vizual + mic damage în jur. CD ≥ 18s.

### Skill tree
- Whirlwind owned, Shockwave cost 1, Battle Shout cost 2.

### Acceptance
- Whirlwind clar pe sprite; shout se vede pe convoi.

---

## PROMPT — PALADIN

Repară **doar Paladin** (`heroes/Paladin.js`).

### Basic
- **Blessed Hammer**: ciocane orbitale care damage pe contact (hit set). CD ~1.35s.

### Skill
- **Heaven Strike**: stâlp de lumină pe țintă, AoE mic. CD ~1.7s.

### Ultimate
- **Mass Heal**: heal % pe convoi + inel holy expand. CD ≥ 18s.

### Skill tree
- Hammer owned, Heaven Strike cost 1, Mass Heal cost 2.

### Acceptance
- Hammer orbits visible; heal crește HP bar convoi.

---

## PROMPT — INFRA (rulează o dată, înaintea claselor dacă e nevoie)

Nu rescrie skill-uri aici. Asigură:
1. `index.html` încarcă: SkillEffects → Hero.js → toate clasele → heroes.js (factory) → SkillTree → managers → game.js.
2. `hero.dir` e mereu string (`UP/DOWN/LEFT/RIGHT`), niciodată obiectul `player.dir`.
3. Un singur owner pentru `hero.update` (GameEngine), nu și ConvoyManager.
4. `CollisionSystem` respectă `pierce` / `visualOnlyCollision`; fără `console.log` pe frame.
5. Skill tree UI funcțional (T), skill points din level-up / skill orbs.
6. Smoke manual: eroi vizibili, atacă, fără CRASH roșu pe ecran.
