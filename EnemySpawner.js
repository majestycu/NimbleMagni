window.EnemySpawner = (function () {
    const STATS = {
        rotwalker: { hp: 38, speed: 38, radius: 14, sprite: 'rotwalker' },
        hedge_imp: { hp: 16, speed: 92, radius: 9, sprite: 'hedge_imp' },
        bramble_rat: { hp: 28, speed: 70, radius: 11, sprite: 'bramble_rat', ranged: true },
        fen_chanter: { hp: 34, speed: 52, radius: 11, sprite: 'fen_chanter', ranged: true },
        sand_scarab: { hp: 32, speed: 74, radius: 11, sprite: 'scarab' },
        dust_jackal: { hp: 22, speed: 110, radius: 10, sprite: 'dust_jackal' },
        cinder_nomad: { hp: 40, speed: 58, radius: 12, sprite: 'cinder_nomad', ranged: true },
        web_drone: { hp: 20, speed: 88, radius: 9, sprite: 'web_drone' },
        fang_spider: { hp: 36, speed: 70, radius: 13, sprite: 'fang_spider' },
        temple_cultist: { hp: 44, speed: 50, radius: 12, sprite: 'temple_cultist', ranged: true },
        ash_raider: { hp: 34, speed: 80, radius: 11, sprite: 'ash_raider' },
        council_acolyte: { hp: 42, speed: 55, radius: 12, sprite: 'council_acolyte', ranged: true },
        horn_brute: { hp: 70, speed: 42, radius: 16, sprite: 'horn_brute' },
        ember_hound: { hp: 30, speed: 100, radius: 11, sprite: 'ember_hound' },
        void_thrall: { hp: 48, speed: 60, radius: 13, sprite: 'void_thrall' },
        keep_sentinel: { hp: 64, speed: 46, radius: 14, sprite: 'keep_sentinel', ranged: true },
        crypt_warden: { hp: 420, speed: 46, radius: 22, sprite: 'crypt_warden', boss: true },
        dune_hollow: { hp: 520, speed: 36, radius: 26, sprite: 'dune_hollow', boss: true, burrow: true },
        venom_matron: { hp: 480, speed: 52, radius: 24, sprite: 'venom_matron', boss: true, poison: true },
        hall_cleaver: { hp: 380, speed: 58, radius: 22, sprite: 'hall_cleaver', boss: true },
        council_shade: { hp: 560, speed: 44, radius: 22, sprite: 'council_shade', boss: true, caster: true },
        ash_sovereign: { hp: 640, speed: 50, radius: 24, sprite: 'ash_sovereign', boss: true },
        last_ember: { hp: 820, speed: 42, radius: 26, sprite: 'last_ember', boss: true, caster: true }
    };

    const AFFIXES = ['swift', 'armored', 'vampiric', 'volatile'];

    let enemies = [];
    let spawnTimer = 0;
    let eliteTimer = 12;

    function edgePos(canvas, left) {
        const side = Math.floor(Math.random() * 4);
        const m = 46;
        if (side === 0) return { x: left + Math.random() * (canvas.width - left), y: -m };
        if (side === 1) return { x: left + Math.random() * (canvas.width - left), y: canvas.height + m };
        if (side === 2) return { x: left + m, y: Math.random() * canvas.height };
        return { x: canvas.width + m, y: Math.random() * canvas.height };
    }

    function makeEnemy(type, x, y, extra) {
        const st = STATS[type] || STATS.rotwalker;
        const act = window.currentAct || 1;
        const hpScale = 1 + (act - 1) * 0.22;
        const e = {
            x, y,
            type,
            sprite: st.sprite || type,
            speed: st.speed,
            baseSpeed: st.speed,
            radius: st.radius,
            hp: Math.round(st.hp * hpScale),
            maxHp: Math.round(st.hp * hpScale),
            ranged: !!st.ranged,
            boss: !!st.boss,
            burrow: !!st.burrow,
            poisonAura: !!st.poison,
            caster: !!st.caster,
            shootTimer: Math.random(),
            burrowTimer: 0,
            hidden: false,
            displayName: extra && extra.displayName,
            isElite: !!(extra && extra.elite)
        };
        if (e.isElite) {
            const affix = AFFIXES[Math.floor(Math.random() * AFFIXES.length)];
            e.affix = affix;
            e.maxHp = Math.round(e.maxHp * 2.6);
            e.hp = e.maxHp;
            e.radius *= 1.45;
            if (affix === 'swift') e.speed *= 1.35;
            if (affix === 'armored') e.maxHp = e.hp = Math.round(e.hp * 1.3);
            e.baseSpeed = e.speed;
            e.guaranteedDrop = true;
        }
        return e;
    }

    function spawnRegular(canvas, left, act, gameTime, actKills) {
        if (window.campaignFlags && window.campaignFlags.bossSpawned && !window.campaignFlags.bossDead) return;
        if (actKills >= act.killGate) return;
        const wave = Math.floor(gameTime / 16);
        const pool = act.mobs.filter(m => wave >= m.fromWave);
        if (!pool.length) return;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const p = edgePos(canvas, left);
        enemies.push(makeEnemy(pick.type, p.x, p.y));
    }

    function spawnNamed(canvas, spec) {
        const x = (window.LEFT_PANEL_WIDTH || 220) + (canvas.width - (window.LEFT_PANEL_WIDTH || 220)) / 2;
        enemies.push(makeEnemy(spec.type, x, 90, { displayName: spec.name }));
    }

    function dropFrom(e) {
        const roll = Math.random();
        const guaranteed = e.isElite || e.boss || e.guaranteedDrop;
        if (guaranteed || roll < 0.55) {
            window.xpGems.push({ x: e.x, y: e.y, value: e.boss ? 8 : (e.isElite ? 4 : 1) });
        }
        if (guaranteed || roll > 0.82) {
            const kinds = ['BOOTS', 'ATTACK_SPEED', 'HEART', 'MIGHTY_ORB'];
            window.itemDrops.push({
                x: e.x + 8,
                y: e.y,
                type: kinds[Math.floor(Math.random() * kinds.length)]
            });
        }
        if (e.boss || (e.isElite && Math.random() < 0.5) || Math.random() < 0.08) {
            window.skillOrbs.push({ x: e.x - 8, y: e.y + 6 });
        }
        if ((e.boss || e.isElite) && Math.random() < 0.4) {
            window.chests.push({ x: e.x, y: e.y + 18, isBossChest: !!e.boss });
        }
        window.killsSinceLastChest = (window.killsSinceLastChest || 0) + 1;
        if (window.killsSinceLastChest >= 18) {
            window.killsSinceLastChest = 0;
            window.unclaimedHeroes.push({
                x: e.x,
                y: e.y - 20,
                type: ['WARRIOR', 'MAGE', 'ROGUE', 'NECROMANCER', 'PALADIN', 'DRUID'][Math.floor(Math.random() * 6)],
                pulseTimer: 0
            });
        }
    }

    function updateEnemy(e, player, dt, projectiles) {
        if (window.StatusEffects) window.StatusEffects.tickEnemy(e, dt);
        if (e.burrow) {
            e.burrowTimer += dt;
            if (e.burrowTimer > 4) {
                e.hidden = !e.hidden;
                e.burrowTimer = 0;
                if (!e.hidden) {
                    e.x = player.x + (Math.random() - 0.5) * 80;
                    e.y = player.y + (Math.random() - 0.5) * 80;
                }
            }
            if (e.hidden) return;
        }
        const ang = Math.atan2(player.y - e.y, player.x - e.x);
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (e.ranged && dist < 150) {
            e.x -= Math.cos(ang) * e.speed * dt;
            e.y -= Math.sin(ang) * e.speed * dt;
        } else {
            e.x += Math.cos(ang) * e.speed * dt;
            e.y += Math.sin(ang) * e.speed * dt;
        }
        if (e.ranged || e.caster) {
            e.shootTimer += dt;
            if (e.shootTimer >= (e.caster ? 1.6 : 2.6)) {
                e.shootTimer = 0;
                projectiles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(ang) * 160,
                    vy: Math.sin(ang) * 160,
                    damage: e.caster ? 18 : 10,
                    radius: 7,
                    isEnemy: true,
                    life: 2.4,
                    active: true,
                    color: e.poisonAura ? '#84cc16' : '#f97316',
                    update(t) {
                        this.x += this.vx * t;
                        this.y += this.vy * t;
                        this.life -= t;
                        if (this.life <= 0) this.active = false;
                    }
                });
            }
        }
        if (e.poisonAura) {
            (window.convoi || []).forEach(h => {
                if (Math.hypot(h.x - e.x, h.y - e.y) < 70) {
                    if (window.player && window.player.invulnerableTimer <= 0) {
                        window.player.hp -= 4 * dt;
                    }
                }
            });
        }
    }

    function maybeAdvance(player, canvas, addFloatingText) {
        const flags = window.campaignFlags;
        const act = window.Campaign.current();
        if (!flags.bossDead) return;
        if (act.finale && !flags.finaleSpawned) {
            flags.finaleSpawned = true;
            spawnNamed(canvas, act.finale);
            addFloatingText({ x: player.x, y: player.y - 40, text: act.finale.name.toUpperCase() + ' RISES', color: '#ef4444', timer: 3 });
            return;
        }
        if (act.finale && flags.finaleSpawned && !flags.finaleDead) return;
        if (act.id >= 5) {
            addFloatingText({ x: player.x, y: player.y - 40, text: 'THE KEEP STANDS', color: '#facc15', timer: 4 });
            return;
        }
        if (!flags.portal) {
            flags.portal = {
                x: (window.LEFT_PANEL_WIDTH || 220) + (canvas.width - (window.LEFT_PANEL_WIDTH || 220)) / 2,
                y: canvas.height / 2,
                angle: 0
            };
            window.townPortal = flags.portal;
        }
        flags.portal.angle += 0.05;
        if (Math.hypot(player.x - flags.portal.x, player.y - flags.portal.y) < 36) {
            window.currentAct = act.id + 1;
            window.actKills = 0;
            flags.bossSpawned = false;
            flags.bossDead = false;
            flags.slaughterSpawned = false;
            flags.portal = null;
            window.townPortal = null;
            enemies = [];
            const next = window.Campaign.current();
            window.boardDecor = window.WorldBoard.generate(canvas, next);
            addFloatingText({ x: player.x, y: player.y - 36, text: next.banner, color: '#facc15', timer: 3.2 });
            if (window.SoundManager) window.SoundManager.collect();
        }
    }

    function update(dt, canvas, gameTime, player, projectiles, addFloatingText) {
        const act = window.Campaign.current();
        const left = window.LEFT_PANEL_WIDTH || 220;
        const flags = window.campaignFlags || window.Campaign.reset() || window.campaignFlags;
        spawnTimer += dt;
        eliteTimer += dt;
        const interval = Math.max(1.15, 2.4 - Math.floor(gameTime / 30) * 0.12);
        if (spawnTimer > interval) {
            spawnTimer = 0;
            spawnRegular(canvas, left, act, gameTime, window.actKills || 0);
        }
        if (eliteTimer > 28) {
            eliteTimer = 0;
            const pool = act.mobs;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const p = edgePos(canvas, left);
            enemies.push(makeEnemy(pick.type, p.x, p.y, { elite: true }));
            addFloatingText({ x: player.x, y: player.y - 24, text: 'ELITE', color: '#facc15', timer: 1.4 });
        }
        if (act.slaughter && (window.actKills || 0) >= act.slaughter.atKills && !flags.slaughterSpawned) {
            flags.slaughterSpawned = true;
            spawnNamed(canvas, act.slaughter);
            addFloatingText({ x: player.x, y: player.y - 40, text: act.slaughter.name.toUpperCase(), color: '#f97316', timer: 2.8 });
        }
        if ((window.actKills || 0) >= act.killGate && !flags.bossSpawned) {
            flags.bossSpawned = true;
            spawnNamed(canvas, act.boss);
            addFloatingText({ x: player.x, y: player.y - 40, text: act.boss.name.toUpperCase(), color: '#dc2626', timer: 3 });
        }
        enemies.forEach(e => updateEnemy(e, player, dt, projectiles));
        const alive = [];
        enemies.forEach(e => {
            if (e.hp > 0) alive.push(e);
            else {
                dropFrom(e);
                window.kills = (window.kills || 0) + 1;
                window.actKills = (window.actKills || 0) + 1;
                window.score = (window.score || 0) + (e.boss ? 200 : (e.isElite ? 40 : 10));
                if (e.type === (act.boss && act.boss.type)) flags.bossDead = true;
                if (act.finale && e.type === act.finale.type) flags.finaleDead = true;
                if (window.gainXp) window.gainXp(e.boss ? 6 : 1);
            }
        });
        enemies = alive;
        maybeAdvance(player, canvas, addFloatingText);
        window.enemies = enemies;
    }

    function draw(ctx) {
        enemies.forEach(e => {
            if (e.hidden) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = '#78716c';
                ctx.beginPath();
                ctx.ellipse(e.x, e.y, e.radius, e.radius * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return;
            }
            if (e.isElite) {
                ctx.save();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            const foeImg = window.AssetBank && (
                window.AssetBank.get('foes', e.sprite) || window.AssetBank.get('foes', e.type)
            );
            const size = e.boss ? 78 : (e.isElite ? 56 : 44);
            const painted = foeImg && window.AssetBank.drawChroma(ctx, foeImg, e.x, e.y - 6, size, size);
            if (!painted && window.render8BitEntity) {
                window.render8BitEntity(ctx, e.x, e.y, e.sprite || e.type, 'down');
            }
            if (e.hp < e.maxHp || e.boss || e.isElite) {
                const bw = e.boss ? 48 : 22;
                const bx = e.x - bw / 2;
                const by = e.y - e.radius - 10;
                ctx.fillStyle = '#111';
                ctx.fillRect(bx, by, bw, 4);
                ctx.fillStyle = e.boss ? '#facc15' : '#22c55e';
                ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 4);
            }
            if (e.displayName || e.boss) {
                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(e.displayName || e.type, e.x, e.y - e.radius - 16);
            }
            if (e.affix) {
                ctx.fillStyle = '#fde68a';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(e.affix.toUpperCase(), e.x, e.y + e.radius + 12);
            }
        });
        const flags = window.campaignFlags;
        if (flags && flags.portal) {
            const tp = flags.portal;
            ctx.save();
            ctx.translate(tp.x, tp.y);
            ctx.rotate(tp.angle);
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(59,130,246,0.35)';
            ctx.fill();
            ctx.restore();
        }
    }

    function reset() {
        enemies = [];
        spawnTimer = 0;
        eliteTimer = 8;
        window.enemies = enemies;
    }

    return {
        get enemies() { return enemies; },
        set enemies(v) { enemies = v || []; window.enemies = enemies; },
        update,
        draw,
        reset
    };
})();
