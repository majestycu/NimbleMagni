window.addEventListener('error', function(e) {
  console.error("CRASH JOC:", e.message, e.filename, e.lineno);
  const errBox = document.getElementById('debug-error') || document.createElement('div');
  errBox.id = 'debug-error';
  errBox.style = 'position:fixed;top:0;left:0;width:100%;background:rgba(200,0,0,0.9);color:#fff;font-size:12px;z-index:99999;padding:6px;word-break:break-all;font-family:monospace;';
  errBox.innerText = `CRASH L${e.lineno}: ${e.message}`;
  document.body.appendChild(errBox);
});

window.addEventListener('load', () => {
    if (window.AssetBank) window.AssetBank.preload();
    const canvas = document.getElementById('gameCanvas');
    window.canvas = canvas;
    const ctx = canvas.getContext('2d');
    window.ctx = ctx;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.TRAIL_SPACING = 23;
    window.LEFT_PANEL_WIDTH = 220;

    window.gameState = 'START';
    window.gamePaused = false;
    window.currentAct = 1;
    window.score = 0;
    window.kills = 0;
    window.gameTime = 0;

    window.player = {
        x: window.LEFT_PANEL_WIDTH + (canvas.width - window.LEFT_PANEL_WIDTH) / 2,
        y: canvas.height / 2,
        speed: (window.Campaign && window.Campaign.PLAYER_SPEED) || 132,
        vx: 0,
        vy: -((window.Campaign && window.Campaign.PLAYER_SPEED) || 132),
        dir: { x: 0, y: -1 },
        radius: 12,
        hp: 150,
        maxHp: 150,
        invulnerableTimer: 0
    };

    window.convoi = [];
    window.trail = [];
    window.projectiles = [];
    window.chests = [];
    window.particles = [];
    window.killsSinceLastChest = 0;
    window.grassPatches = [];
    window.forestDecorations = [];
    window.itemDrops = [];
    window.skillOrbs = [];
    window.floatingTexts = [];
    window.townPortal = null;
    window.xpGems = [];
    window.unclaimedHeroes = [];
    window.partyLevel = 1;
    window.partyXp = 0;
    window.xpNeededForNext = 10;
    window.skillPoints = 1;
    if (window.GroundZones) window.GroundZones.clear();

    window.SKILL_NAMES = { 
        WARRIOR: ["whirlwind", "shockwave", "battleshout"],
        PALADIN: ["heavenstrike", "blessedhammer", "massheal"],
        MAGE: ["chainlightning", "meteor", "blizzard"],
        NECROMANCER: ["bloodwave", "curse", "poisonnova"],
        DRUID: ["entanglingroots", "hurricane", "cataclysm"],
        ROGUE: ["arrowvolley", "penetratingshot", "frostshot"]
    };

    window.HERO_EMOJIS = {
        WARRIOR: '⚔️',
        PALADIN: '🛡️',
        MAGE: '🔮',
        ROGUE: '🏹',
        NECROMANCER: '💀',
        DRUID: '🌿'
    };

    window.setDirection = function(x, y) {
        if (window.player.vx !== 0 && x === -Math.sign(window.player.vx)) return;
        if (window.player.vy !== 0 && y === -Math.sign(window.player.vy)) return;

        if (window.player.vx !== 0 && y !== 0) {
            window.player.vx = 0;
            window.player.vy = y * window.player.speed;
        } else if (window.player.vy !== 0 && x !== 0) {
            window.player.vy = 0;
            window.player.vx = x * window.player.speed;
        } else {
            window.player.vx = x * window.player.speed;
            window.player.vy = y * window.player.speed;
        }
        window.player.dir = {
            x: window.player.vx !== 0 ? Math.sign(window.player.vx) : 0,
            y: window.player.vy !== 0 ? Math.sign(window.player.vy) : 0
        };
    };

    window.togglePause = function() {
        window.gamePaused = !window.gamePaused;
        if (window.GameEngine) {
            window.GameEngine.gamePaused = window.gamePaused;
        }
    };

    window.toggleSkillTree = function() {
        if (window.SkillTreeUI) window.SkillTreeUI.toggle();
    };

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 't') {
            window.toggleSkillTree();
            e.preventDefault();
        }
    });

    canvas.addEventListener('click', (e) => {
        if (!window.SkillTreeUI || !window.SkillTreeUI.open) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        window.SkillTreeUI.handleClick(x, y, canvas);
    });

    if (window.InputManager && typeof window.InputManager.init === 'function') {
        window.InputManager.init(canvas, window.setDirection, window.togglePause);
    }

    const startBtn = document.getElementById('startBtn') || document.getElementById('start-btn') || document.querySelector('.start-btn');
    if (startBtn && !startBtn._listenerAttached) {
        startBtn._listenerAttached = true;
        startBtn.addEventListener('click', () => {
            const heroSelect = document.getElementById('heroSelect') || document.getElementById('hero-select');
            const leaderType = heroSelect ? heroSelect.value : 'warrior';
            window.startGame(leaderType);
        });
    }

    const restartBtn = document.getElementById('restartBtn') || document.getElementById('restart-btn') || document.querySelector('.restart-btn');
    if (restartBtn && !restartBtn._listenerAttached) {
        restartBtn._listenerAttached = true;
        restartBtn.addEventListener('click', () => {
            const heroSelect = document.getElementById('heroSelect') || document.getElementById('hero-select');
            const leaderType = heroSelect ? heroSelect.value : 'warrior';
            window.startGame(leaderType);
        });
    }

    window.gainXp = function(amount) {
        if (window.partyLevel >= 3) return;
        window.partyXp += amount;
        if (window.partyLevel === 1 && window.partyXp >= 10) {
            window.partyLevel = 2;
            window.partyXp -= 10;
            window.xpNeededForNext = 25;
            window.skillPoints = (window.skillPoints || 0) + 1;
            if (window.SoundManager) window.SoundManager.collect();
        } else if (window.partyLevel === 2 && window.partyXp >= 25) {
            window.partyLevel = 3;
            window.partyXp = 25;
            window.xpNeededForNext = 25;
            window.skillPoints = (window.skillPoints || 0) + 2;
            if (window.SoundManager) window.SoundManager.collect();
        }
    };

    window.startGame = function(leaderType = 'warrior') {
        console.log("Selected Hero:", leaderType);
        console.log("Convoy status:", window.convoi);
        console.log("Canvas context:", ctx);
        if (window.GameEngine) {
            window.GameEngine.stop();
        }
        if (window.SoundManager) window.SoundManager.init();
        window.Campaign.reset();
        window.actKills = 0;
        if (window.EnemySpawner) window.EnemySpawner.reset();
        window.gameState = 'PLAYING';
        window.gamePaused = false;
        window.currentAct = 1;
        window.score = 0;
        window.kills = 0;
        window.gameTime = 0;
        window.killsSinceLastChest = 0;

        window.player.speed = window.Campaign.PLAYER_SPEED;
        window.player.x = window.LEFT_PANEL_WIDTH + (canvas.width - window.LEFT_PANEL_WIDTH) / 2;
        window.player.y = canvas.height / 2;
        window.player.vx = 0;
        window.player.vy = -window.player.speed;
        window.player.dir = { x: 0, y: -1 };
        window.player.maxHp = 150;
        window.player.hp = 150;
        window.player.invulnerableTimer = 0;

        let lType = leaderType ? leaderType.toUpperCase() : 'WARRIOR';
        let leaderHero = window.HeroFactory ? window.HeroFactory.createHero(lType) : new window.HeroManager.Hero(lType);
        leaderHero.currentSkill = window.SKILL_NAMES[lType] ? window.SKILL_NAMES[lType][0] : 'whirlwind';
        window.convoi = [leaderHero];

        window.trail = [];
        for (let i = 0; i < 300; i++) {
            window.trail.push({ x: window.player.x, y: window.player.y + i * 2 });
        }
        if (window.EnemiesAct1) {
            window.EnemiesAct1.enemies = [];
        }
        window.projectiles = [];
        window.chests = [];
        window.particles = [];
        window.skillOrbs = [];
        window.itemDrops = [];
        window.xpGems = [];
        window.unclaimedHeroes = [];

        window.gameUpgrades = { 
            speedBoostCount: 0,
            attackSpeedCount: 0,
            mightyOrbCount: 0
        };
        window.player.speed = window.Campaign.PLAYER_SPEED;
        window.player.vx = 0;
        window.player.vy = -window.player.speed;

        window.partyLevel = 1;
        window.partyXp = 0;
        window.xpNeededForNext = 10;
        window.skillPoints = 1;
        if (window.GroundZones) window.GroundZones.clear();
        if (window.SkillTreeUI) window.SkillTreeUI.open = false;

        let availableTypes = ['WARRIOR', 'MAGE', 'ROGUE', 'NECROMANCER', 'PALADIN', 'DRUID'].filter(t => t !== lType);
        let startHeroType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        window.unclaimedHeroes.push({
            x: window.player.x + 150,
            y: window.player.y - 150,
            type: startHeroType,
            pulseTimer: 0,
            currentSkill: window.SKILL_NAMES[startHeroType] ? window.SKILL_NAMES[startHeroType][0] : 'whirlwind'
        });

        let wallThickness = 32;
        window.grassPatches = [];
        for (let i = 0; i < 35; i++) {
            let gx = window.LEFT_PANEL_WIDTH + wallThickness + 20 + Math.random() * (canvas.width - window.LEFT_PANEL_WIDTH - wallThickness * 2 - 40);
            let gy = wallThickness + 20 + Math.random() * (canvas.height - wallThickness * 2 - 40);
            let flowerColor = Math.random() < 0.5 ? '#dc2626' : '#1e3a8a';
            window.grassPatches.push({ x: gx, y: gy, color: flowerColor, size: 2 + Math.random() * 3 });
        }

        window.forestDecorations = [];
        let attempts = 0;
        while (window.forestDecorations.length < 18 && attempts < 200) {
            attempts++;
            let tx = window.LEFT_PANEL_WIDTH + wallThickness + 32 + Math.random() * (canvas.width - window.LEFT_PANEL_WIDTH - wallThickness * 2 - 64);
            let ty = wallThickness + 32 + Math.random() * (canvas.height - wallThickness * 2 - 64);
            
            let distToCenter = Math.hypot(tx - (window.LEFT_PANEL_WIDTH + (canvas.width - window.LEFT_PANEL_WIDTH) / 2), ty - canvas.height / 2);
            if (distToCenter < 100) continue;
            
            let tooClose = false;
            for (let dec of window.forestDecorations) {
                if (Math.hypot(tx - dec.x, ty - dec.y) < 70) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
            
            let r = Math.random();
            let decType = r < 0.5 ? 'tree' : (r < 0.75 ? 'stump' : (r < 0.9 ? 'tombstone' : 'bone'));
            window.forestDecorations.push({ x: tx, y: ty, type: decType });
        }

        window.boardDecor = window.WorldBoard.generate(canvas, window.Campaign.current());

        let startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.style.display = 'none';
        let gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) gameOverMenu.style.display = 'none';
        let hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';

        if (window.GameEngine) {
            window.GameEngine.start('PLAYING');
        }
    };

    window.gameOver = function() {
        window.gameState = 'GAMEOVER';
        if (window.GameEngine) {
            window.GameEngine.stop();
        }
        if (window.SoundManager) window.SoundManager.gameOver();
        document.getElementById('finalScore').innerText = window.score;
        document.getElementById('finalKills').innerText = window.kills;
        document.getElementById('gameOverMenu').style.display = 'flex';
    };

    window.drawTorch = function(x, y, time) {
        let pulseRadius = 70 + Math.sin(time * 8) * 10;
        let grad = ctx.createRadialGradient(x, y, 5, x, y, pulseRadius);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#71717a';
        ctx.fillRect(x - 6, y - 6, 12, 12);
        
        let flicker = Math.sin(time * 15) * 3;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(x, y - 8 + flicker * 0.5, 6 + Math.abs(flicker) * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, y - 8 + flicker * 0.3, 3 + Math.abs(flicker) * 0.2, 0, Math.PI * 2);
        ctx.fill();
    };

    window.draw = function() {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const act = window.Campaign.current();
            if (window.WorldBoard) {
                window.WorldBoard.draw(ctx, canvas, act, window.boardDecor || [], window.gameTime);
            }

            if (window.WaveManager && window.WaveManager.townPortal) {
                let tp = window.WaveManager.townPortal;
                ctx.save();
                ctx.translate(tp.x, tp.y);
                ctx.rotate(tp.angle);
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#93c5fd';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }

            window.chests.forEach(c => {
                let pulse = Math.sin(window.gameTime * 8) * 4;
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 15 + pulse;
                ctx.fillStyle = c.isBossChest ? '#fbbf24' : '#eab308';
                ctx.fillRect(c.x - 12, c.y - 10, 24, 20);
                ctx.fillStyle = '#18181b';
                ctx.fillRect(c.x - 3, c.y - 4, 6, 8);
                ctx.shadowBlur = 0;
            });

            window.itemDrops.forEach(drop => {
                ctx.save();
                ctx.shadowBlur = 10;
                if (drop.type === 'BOOTS') {
                    ctx.shadowColor = '#06b6d4';
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(drop.x - 8, drop.y - 8, 16, 16);
                } else if (drop.type === 'ATTACK_SPEED') {
                    ctx.shadowColor = '#ef4444';
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2);
                    ctx.fill();
                } else if (drop.type === 'HEART') {
                    ctx.shadowColor = '#22c55e';
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(drop.x - 3, drop.y - 9, 6, 18);
                    ctx.fillRect(drop.x - 9, drop.y - 3, 18, 6);
                } else if (drop.type === 'MIGHTY_ORB') {
                    ctx.shadowColor = '#a855f7';
                    ctx.fillStyle = '#a855f7';
                    ctx.beginPath();
                    ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            window.skillOrbs.forEach(orb => {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#f472b6';
                ctx.fillStyle = '#f472b6';
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            window.unclaimedHeroes.forEach(uh => {
                ctx.save();
                ctx.fillStyle = '#4b5563';
                ctx.beginPath();
                ctx.arc(uh.x, uh.y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            window.xpGems.forEach(gem => {
                ctx.save();
                ctx.fillStyle = '#22d3ee';
                ctx.beginPath();
                ctx.arc(gem.x, gem.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            if (window.GroundZones) window.GroundZones.draw(ctx);

            if (window.EnemySpawner) {
                window.EnemySpawner.draw(ctx);
            }

            window.projectiles.forEach(p => {
                if (typeof p.draw === 'function') {
                    p.draw(ctx);
                } else {
                    ctx.fillStyle = p.color || '#facc15';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius || 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            window.convoi.forEach((hero, index) => {
                if (index === 0 && window.player.invulnerableTimer > 0 && Math.floor(window.gameTime * 30) % 2 === 0) {
                    ctx.globalAlpha = 0.4;
                }
                if (hero && typeof hero.draw === 'function') {
                    hero.draw(ctx, index === 0);
                }
                ctx.globalAlpha = 1.0;
            });

            window.particles.forEach(p => {
                if (p.draw) p.draw(ctx);
            });

            window.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.fillStyle = ft.color;
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            ctx.save();
            ctx.fillStyle = 'rgba(15, 15, 22, 0.95)';
            ctx.fillRect(0, 0, window.LEFT_PANEL_WIDTH, canvas.height);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, window.LEFT_PANEL_WIDTH, canvas.height);

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("NIMBLE MAGNI", window.LEFT_PANEL_WIDTH / 2, 25);
            const actLabel = window.Campaign.current();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(actLabel ? actLabel.name : '', window.LEFT_PANEL_WIDTH / 2, 40);

            let panelY = 55;
            window.convoi.forEach((hero, idx) => {
                let hType = hero && hero.type ? hero.type.toUpperCase() : 'WARRIOR';
                let emoji = window.HERO_EMOJIS[hType] || '⭐';
                const currentSkillName = (hero && hero.skillPool && hero.skillPool[hero.activeSkillIndex || 0]) || '';
                
                ctx.fillStyle = idx === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 30, 40, 0.8)';
                ctx.fillRect(10, panelY, window.LEFT_PANEL_WIDTH - 20, 70);
                ctx.strokeStyle = idx === 0 ? '#60a5fa' : '#4b5563';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(10, panelY, window.LEFT_PANEL_WIDTH - 20, 70);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`${emoji} ${hType}`, 18, panelY + 20);

                ctx.fillStyle = '#38bdf8';
                ctx.font = '11px monospace';
                ctx.fillText(`Skill: ${currentSkillName}`, 18, panelY + 40);

                ctx.fillStyle = '#a855f7';
                let ultText = "";
                if (window.partyLevel >= 3) {
                    let status = hero && hero.ultimateReady ? "GATA" : `${(hero && hero.ultimateCooldown || 0).toFixed(1)}s`;
                    let ultSkillName = hero && hero.ultimateSkill ? hero.ultimateSkill : 'ultimate';
                    ultText = `Ult: ${ultSkillName} (${status})`;
                } else {
                    ultText = "Ult: Blocat (Lvl 3)";
                }
                ctx.fillText(ultText, 18, panelY + 58);

                panelY += 80;
            });

            ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
            ctx.fillRect(10, canvas.height - 140, window.LEFT_PANEL_WIDTH - 20, 130);
            ctx.strokeStyle = '#4b5563';
            ctx.strokeRect(10, canvas.height - 140, window.LEFT_PANEL_WIDTH - 20, 130);

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("📊 STATS & XP", window.LEFT_PANEL_WIDTH / 2, canvas.height - 120);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Scor: ${window.score}`, 20, canvas.height - 95);
            ctx.fillText(`Inamici: ${window.kills}`, 20, canvas.height - 75);
            ctx.fillText(`Eroi: ${window.convoi.length} | SP: ${window.skillPoints || 0}`, 20, canvas.height - 55);
            let lvlTextStr = window.partyLevel >= 3 ? "MASTER TIER" : `Lvl ${window.partyLevel} (${window.partyXp}/${window.xpNeededForNext})`;
            ctx.fillText(`Party: ${lvlTextStr}`, 20, canvas.height - 35);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('T = Skill Tree', 20, canvas.height - 18);

            ctx.restore();

            if (window.SkillTreeUI) window.SkillTreeUI.draw(ctx, canvas);

            if (window.gamePaused) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("⏸️ JOC ÎN PAUZĂ - Atinge pentru a continua", canvas.width / 2, canvas.height / 2);
                ctx.restore();
            }
        } catch (e) {
            console.error("Render error in window.draw:", e);
        }
    };
});