(function () {
    function ensureEnemyRuntime(e) {
        if (!e) return;
        if (e.baseSpeed === undefined) e.baseSpeed = e.speed || 1;
        if (e.slowMult === undefined) e.slowMult = 1;
        if (e.damageTakenMult === undefined) e.damageTakenMult = 1;
        if (e.poisonDps === undefined) e.poisonDps = 0;
        if (e.poisonTimer === undefined) e.poisonTimer = 0;
        if (e.curseTimer === undefined) e.curseTimer = 0;
        if (e.slowTimer === undefined) e.slowTimer = 0;
    }

    window.StatusEffects = {
        applySlow(enemy, duration, factor) {
            ensureEnemyRuntime(enemy);
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, duration);
            enemy.slowMult = Math.min(enemy.slowMult || 1, factor);
            enemy.speed = enemy.baseSpeed * enemy.slowMult;
        },
        applyCurse(enemy, duration, damageMult) {
            ensureEnemyRuntime(enemy);
            enemy.curseTimer = Math.max(enemy.curseTimer || 0, duration);
            enemy.damageTakenMult = Math.max(enemy.damageTakenMult || 1, damageMult);
            this.applySlow(enemy, duration, 0.45);
        },
        applyPoison(enemy, duration, dps) {
            ensureEnemyRuntime(enemy);
            enemy.poisonTimer = Math.max(enemy.poisonTimer || 0, duration);
            enemy.poisonDps = Math.max(enemy.poisonDps || 0, dps);
        },
        dealDamage(enemy, amount, source) {
            if (!enemy || enemy.hp === undefined || enemy.hp <= 0) return 0;
            ensureEnemyRuntime(enemy);
            const dealt = amount * (enemy.damageTakenMult || 1);
            enemy.hp -= dealt;
            if (source && source.onDamageDealt) source.onDamageDealt(dealt, enemy);
            return dealt;
        },
        tickEnemy(enemy, dt) {
            if (!enemy) return;
            ensureEnemyRuntime(enemy);
            if (enemy.poisonTimer > 0) {
                enemy.poisonTimer -= dt;
                enemy.hp -= (enemy.poisonDps || 0) * dt;
                if (enemy.poisonTimer <= 0) enemy.poisonDps = 0;
            }
            if (enemy.curseTimer > 0) {
                enemy.curseTimer -= dt;
                if (enemy.curseTimer <= 0) enemy.damageTakenMult = 1;
            }
            if (enemy.slowTimer > 0) {
                enemy.slowTimer -= dt;
                if (enemy.slowTimer <= 0) {
                    enemy.slowMult = 1;
                    enemy.speed = enemy.baseSpeed;
                } else {
                    enemy.speed = enemy.baseSpeed * enemy.slowMult;
                }
            }
        }
    };

    window.GroundZones = {
        zones: [],
        clear() { this.zones = []; },
        add(zone) {
            zone.active = true;
            this.zones.push(zone);
        },
        update(dt, enemies) {
            this.zones.forEach(z => {
                if (!z.active) return;
                z.life -= dt;
                if (z.life <= 0) {
                    z.active = false;
                    return;
                }
                if (typeof z.update === 'function') z.update(dt, enemies || []);
            });
            this.zones = this.zones.filter(z => z.active);
        },
        draw(ctx) {
            this.zones.forEach(z => {
                if (z.active && typeof z.draw === 'function') z.draw(ctx);
            });
        }
    };

    window.SkillFx = {
        dirAngle(dir, fallback) {
            if (dir && typeof dir === 'object' && (dir.x !== 0 || dir.y !== 0)) {
                return Math.atan2(dir.y, dir.x);
            }
            if (typeof dir === 'string') {
                const d = dir.toUpperCase();
                if (d === 'LEFT') return Math.PI;
                if (d === 'RIGHT') return 0;
                if (d === 'UP') return -Math.PI / 2;
                if (d === 'DOWN') return Math.PI / 2;
            }
            return fallback !== undefined ? fallback : -Math.PI / 2;
        },
        dirString(dir, player) {
            if (typeof dir === 'string') return dir.toUpperCase();
            const src = dir && typeof dir === 'object' ? dir : (player && player.dir);
            if (src && typeof src === 'object') {
                if (Math.abs(src.x) > Math.abs(src.y)) return src.x < 0 ? 'LEFT' : 'RIGHT';
                if (src.y !== 0) return src.y < 0 ? 'UP' : 'DOWN';
            }
            return 'DOWN';
        },
        nearestEnemies(x, y, enemies, maxDist) {
            return (enemies || [])
                .filter(m => m && m.hp > 0)
                .map(m => ({ m, d: Math.hypot(m.x - x, m.y - y) }))
                .filter(o => o.d <= maxDist)
                .sort((a, b) => a.d - b.d)
                .map(o => o.m);
        },
        lightningBolt(x1, y1, x2, y2, segments, displacement) {
            const pts = [{ x: x1, y: y1 }];
            const segs = segments || 6;
            const disp = displacement || 18;
            for (let i = 1; i < segs; i++) {
                const t = i / segs;
                const bx = x1 + (x2 - x1) * t;
                const by = y1 + (y2 - y1) * t;
                const nx = -(y2 - y1);
                const ny = x2 - x1;
                const len = Math.hypot(nx, ny) || 1;
                const offset = (Math.random() - 0.5) * 2 * disp;
                pts.push({ x: bx + (nx / len) * offset, y: by + (ny / len) * offset });
            }
            pts.push({ x: x2, y: y2 });
            return pts;
        },
        pushProjectile(list, p) {
            p.active = true;
            if (p.life === undefined) p.life = 2;
            if (p.isHeroProjectile === undefined) p.isHeroProjectile = true;
            list.push(p);
            return p;
        }
    };

    window.SkillTreeCatalog = {
        WARRIOR: [
            { id: 'whirlwind', name: 'Whirlwind', kind: 'basic', desc: 'Spin slash AoE around warrior', unlocked: true },
            { id: 'shockwave', name: 'Shockwave', kind: 'skill', desc: 'Forward crescent force wave', cost: 1 },
            { id: 'battleshout', name: 'Battle Shout', kind: 'ultimate', desc: 'Party buff + roar pulse', cost: 2 }
        ],
        PALADIN: [
            { id: 'blessedhammer', name: 'Blessed Hammer', kind: 'basic', desc: 'Orbiting holy hammers', unlocked: true },
            { id: 'heavenstrike', name: 'Heaven Strike', kind: 'skill', desc: 'Lightning pillar on target', cost: 1 },
            { id: 'massheal', name: 'Mass Heal', kind: 'ultimate', desc: 'Heal convoy + holy ring', cost: 2 }
        ],
        ROGUE: [
            { id: 'arrowvolley', name: 'Arrow Volley', kind: 'basic', desc: 'Fan of 3 arrows', unlocked: true },
            { id: 'penetratingshot', name: 'Penetrating Shot', kind: 'skill', desc: 'Pierce arrow through foes', cost: 1 },
            { id: 'shadowstep', name: 'Shadow Step', kind: 'skill', desc: 'Blink + clone decoy', cost: 1 },
            { id: 'frostshot', name: 'Frost Shot', kind: 'ultimate', desc: 'Freezing arrow nova', cost: 2 }
        ],
        MAGE: [
            { id: 'chainlightning', name: 'Chain Lightning', kind: 'basic', desc: 'Default attack, chains visually', unlocked: true },
            { id: 'meteor', name: 'Meteor', kind: 'skill', desc: 'Falls from sky, leaves fire', cost: 1 },
            { id: 'blizzard', name: 'Blizzard', kind: 'ultimate', desc: 'Persistent slow+damage zone', cost: 2 }
        ],
        NECROMANCER: [
            { id: 'bloodwave', name: 'Blood Wave', kind: 'basic', desc: 'Piercing wave, lifesteal %', unlocked: true },
            { id: 'decrepify', name: 'Decrepify', kind: 'skill', desc: 'Slow + extra dmg + poison', cost: 1 },
            { id: 'poisonnova', name: 'Poison Nova', kind: 'ultimate', desc: 'D2-style poison ring', cost: 2 }
        ],
        DRUID: [
            { id: 'entanglingroots', name: 'Entangling Roots', kind: 'basic', desc: 'Root projectile', unlocked: true },
            { id: 'hurricane', name: 'Hurricane', kind: 'skill', desc: '2-3s vortex, pull + dmg', cost: 1 },
            { id: 'cataclysm', name: 'Cataclysm', kind: 'ultimate', desc: 'Ground crack + fire DOT line', cost: 2 }
        ]
    };
})();
