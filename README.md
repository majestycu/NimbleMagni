# NimbleMagni

Nimble Quest: Sanctuary — canvas convoy action game recovered and rewired after a broken Magni refactor.

## Run locally

```bash
python -m http.server 8765
```

Open `http://127.0.0.1:8765/index.html`

## Controls

- WASD / swipe — move
- P / Space — pause
- T — skill tree

## Structure

- `heroes/` — per-class combat + skills
- `skills/` — shared FX, status, ground zones
- `GameEngine.js` — update/render loop
- `CLASS_PROMPTS.md` — per-class repair prompts
