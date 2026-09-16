window.GameEngine = {
    state: 'MENU',
    gamePaused: false,
    gameLoopId: null,
    lastTime: 0,
    projectiles: [],
    enemies: [],

    start(initialState = 'PLAYING') {
        this.state = initialState;
        this.gamePaused = false;
        this.lastTime = performance.now();
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        this.gameLoopId = requestAnimationFrame((time) => this.loop(time));
    },

    stop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    },

    loop(currentTime) {
        try {
            let dt = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            if (dt > 0.1) dt = 0.1;

            if (this.state === 'PLAYING' && !this.gamePaused && !(window.SkillTreeUI && window.SkillTreeUI.open)) {
                this.update(dt);
            }
            if (window.ctx) this.render(window.ctx);
        } catch (e) {
            console.error('GameEngine loop error:', e);
            if (window.ctx) {
                window.ctx.fillStyle = 'red';
                window.ctx.font = '16px sans-serif';
                window.ctx.fillText('CRASH: ' + e.message, 20, 50);
            }
        }
        this.gameLoopId = requestAnimationFrame((time) => this.loop(time));
    },

    update(deltaTime) {
        window.gameTime = (window.gameTime || 0) + deltaTime;
        if (window.player && window.player.invulnerableTimer > 0) {
            window.player.invulnerableTimer -= deltaTime;
        }

        window.projectiles = this.projectiles = window.projectiles || this.projectiles || [];
        this.enemies = (window.EnemySpawner && window.EnemySpawner.enemies) ? window.EnemySpawner.enemies : (window.enemies || []);
        window.enemies = this.enemies;

        if (window.InputManager && typeof window.InputManager.update === 'function') {
            window.InputManager.update(deltaTime);
        }
        if (window.player) {
            if (window.ConvoyManager && typeof window.ConvoyManager.initMovement === 'function') {
                window.ConvoyManager.initMovement(window.player);
            }
            window.player.x += (window.player.vx || 0) * deltaTime;
            window.player.y += (window.player.vy || 0) * deltaTime;
        }
        if (window.ConvoyManager && window.player && window.trail && window.convoi) {
            window.ConvoyManager.updateConvoy(window.player, window.trail, window.convoi, window.TRAIL_SPACING || 23, deltaTime);
        }

        if (window.EnemySpawner && window.player && window.canvas) {
            window.EnemySpawner.update(
                deltaTime,
                window.canvas,
                window.gameTime || 0,
                window.player,
                this.projectiles,
                (ft) => { if (window.floatingTexts) window.floatingTexts.push(ft); }
            );
            this.enemies = window.EnemySpawner.enemies;
            window.enemies = this.enemies;
        }

        if (window.GroundZones) {
            window.GroundZones.update(deltaTime, this.enemies);
        }

        if (window.convoi) {
            window.convoi.forEach(hero => {
                if (typeof hero.update === 'function') hero.update(deltaTime);
                if (typeof hero.attack === 'function' && window.player) {
                    hero.attack(hero.x, hero.y, this.enemies, this.projectiles, window.player.dir);
                }
            });
        }

        if (this.projectiles) {
            this.projectiles.forEach(p => {
                if (p.update) p.update(deltaTime, this.enemies);
            });
            this.projectiles = this.projectiles.filter(p => p.active !== false && (p.life === undefined || p.life > 0));
            window.projectiles = this.projectiles;
        }

        this.enemies = (window.EnemySpawner && window.EnemySpawner.enemies) || this.enemies.filter(e => e && e.hp > 0);
        window.enemies = this.enemies;

        if (window.particles) {
            window.particles.forEach(p => {
                if (typeof p.update === 'function') p.update(deltaTime);
                else {
                    p.x += p.vx || 0;
                    p.y += p.vy || 0;
                    p.life = (p.life || 1) - deltaTime;
                    p.active = p.life > 0;
                }
            });
            window.particles = window.particles.filter(p => p.active !== false);
        }
        if (window.floatingTexts) {
            window.floatingTexts.forEach(ft => {
                ft.y -= deltaTime * 30;
                ft.timer -= deltaTime;
            });
            window.floatingTexts = window.floatingTexts.filter(ft => ft.timer > 0);
        }

        window.chests = (window.chests || []).filter(c => !c.collected);
        window.itemDrops = (window.itemDrops || []).filter(d => !d.collected);
        window.skillOrbs = (window.skillOrbs || []).filter(o => !o.collected);
        window.xpGems = (window.xpGems || []).filter(g => !g.collected);
        window.unclaimedHeroes = (window.unclaimedHeroes || []).filter(u => !u.collected);

        if (window.CollisionSystem && window.player) {
            window.CollisionSystem.resolveCollisions(
                window.player,
                window.convoi || [],
                this.enemies,
                this.projectiles,
                window.itemDrops || [],
                window.xpGems || [],
                window.chests || [],
                window.skillOrbs || [],
                window.unclaimedHeroes || [],
                window.townPortal,
                window.canvas,
                window.currentAct,
                () => { if (window.gameOver) window.gameOver(); },
                (val) => { if (window.gainXp) window.gainXp(val); },
                (ft) => { if (window.floatingTexts) window.floatingTexts.push(ft); }
            );
        }
    },

    render(ctx) {
        if (window.draw) window.draw();
    }
};
