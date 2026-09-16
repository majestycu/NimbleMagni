window.CollisionSystem = {
    resolveCollisions(player, convoi, enemies, projectiles, items, xpGems, chests, skillOrbs, unclaimedHeroes, townPortal, canvas, currentAct, gameOverCallback, gainXpCallback, addFloatingText) {
        const wallMargin = (window.Campaign && window.Campaign.WALL_MARGIN) || 32;
        const LEFT_PANEL_WIDTH = window.LEFT_PANEL_WIDTH || 220;

        if (player.x < LEFT_PANEL_WIDTH + wallMargin || player.x > canvas.width - wallMargin ||
            player.y < wallMargin || player.y > canvas.height - wallMargin ||
            (window.WorldBoard && window.WorldBoard.hitsWall(player.x, player.y, window.board))) {
            if (window.SoundManager) window.SoundManager.hit();
            gameOverCallback();
            return;
        }

        for (let i = 2; i < convoi.length; i++) {
            if (Math.hypot(player.x - convoi[i].x, player.y - convoi[i].y) < 12) {
                if (window.SoundManager) window.SoundManager.hit();
                gameOverCallback();
                return;
            }
        }

        projectiles.forEach(p => {
            if (!p || !p.active) return;
            if (p.x < LEFT_PANEL_WIDTH - 40 || p.x > canvas.width + 40 || p.y < -40 || p.y > canvas.height + 40) {
                if (!p.pierce) p.active = false;
            }
            if (p.visualOnlyCollision) return;

            if (p.isEnemy === true) {
                if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + (p.radius || 8)) {
                    if (player.invulnerableTimer <= 0) {
                        player.hp -= 15;
                        player.invulnerableTimer = 0.6;
                        if (window.SoundManager) window.SoundManager.hit();
                        if (player.hp <= 0) {
                            gameOverCallback();
                            return;
                        }
                    }
                    p.active = false;
                }
                return;
            }

            // Hero projectiles that self-handle hits in update() should not be double-killed here
            if (p.pierce || typeof p.update === 'function') return;

            enemies.forEach(e => {
                if (!e || typeof e.hp !== 'number' || e.hp <= 0) return;
                if (p.active && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + (p.radius || 8)) {
                    window.StatusEffects.dealDamage(e, p.damage || 1);
                    if (p.onHit) p.onHit(e);
                    p.active = false;
                }
            });
        });

        enemies.forEach(e => {
            if (!e || typeof e.hp !== 'number' || e.hp <= 0) return;
            if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
                if (player.invulnerableTimer <= 0) {
                    player.hp -= 20;
                    player.invulnerableTimer = 0.6;
                    if (window.SoundManager) window.SoundManager.hit();
                    if (player.hp <= 0) {
                        gameOverCallback();
                        return;
                    }
                }
            }
            convoi.forEach(hero => {
                if (Math.hypot(hero.x - e.x, hero.y - e.y) < (hero.radius || 12) + e.radius) {
                    window.StatusEffects.dealDamage(e, 0.35);
                }
            });
        });

        chests.forEach(c => {
            if (c.collected) return;
            if (Math.hypot(player.x - c.x, player.y - c.y) < 30) {
                if (window.SoundManager) window.SoundManager.collect();
                c.collected = true;
                player.hp = Math.min(player.maxHp, player.hp + 25);
                window.score = (window.score || 0) + 200;
                addFloatingText({ x: player.x, y: player.y - 20, text: '+200 / +25 HP', color: '#fbbf24', timer: 1.2 });
            }
        });

        items.forEach(drop => {
            if (drop.collected) return;
            if (Math.hypot(player.x - drop.x, player.y - drop.y) < 18) {
                if (window.SoundManager) window.SoundManager.collect();
                drop.collected = true;
                window.gameUpgrades = window.gameUpgrades || { speedBoostCount: 0, attackSpeedCount: 0, mightyOrbCount: 0 };
                if (drop.type === 'BOOTS') {
                    window.gameUpgrades.speedBoostCount++;
                    player.speed = window.Campaign.PLAYER_SPEED * (1 + window.gameUpgrades.speedBoostCount * 0.08);
                    if (player.vx !== 0) player.vx = Math.sign(player.vx) * player.speed;
                    if (player.vy !== 0) player.vy = Math.sign(player.vy) * player.speed;
                    addFloatingText({ x: player.x, y: player.y - 18, text: 'SPEED', color: '#06b6d4', timer: 1 });
                } else if (drop.type === 'ATTACK_SPEED') {
                    window.gameUpgrades.attackSpeedCount++;
                    (window.convoi || []).forEach(h => { h.castMult = Math.max(0.7, (h.castMult || 1) * 0.94); });
                    addFloatingText({ x: player.x, y: player.y - 18, text: 'CAST', color: '#ef4444', timer: 1 });
                } else if (drop.type === 'HEART') {
                    player.hp = Math.min(player.maxHp, player.hp + 40);
                    addFloatingText({ x: player.x, y: player.y - 18, text: '+HP', color: '#22c55e', timer: 1 });
                } else if (drop.type === 'MIGHTY_ORB') {
                    window.gameUpgrades.mightyOrbCount++;
                    addFloatingText({ x: player.x, y: player.y - 18, text: 'MIGHT', color: '#a855f7', timer: 1 });
                }
            }
        });

        skillOrbs.forEach(orb => {
            if (orb.collected) return;
            if (Math.hypot(player.x - orb.x, player.y - orb.y) < 22) {
                orb.collected = true;
                window.skillPoints = (window.skillPoints || 0) + 1;
                if (window.SoundManager) window.SoundManager.collect();
                addFloatingText({ x: player.x, y: player.y - 20, text: '+1 Skill Point', color: '#f472b6', timer: 1.2 });
            }
        });

        xpGems.forEach(gem => {
            if (gem.collected) return;
            const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
            if (dist < 30) {
                gem.collected = true;
                gainXpCallback(gem.value);
            } else if (dist < 80) {
                const angle = Math.atan2(player.y - gem.y, player.x - gem.x);
                gem.x += Math.cos(angle) * 4;
                gem.y += Math.sin(angle) * 4;
            }
        });

        unclaimedHeroes.forEach(uh => {
            if (uh.collected) return;
            if (Math.hypot(player.x - uh.x, player.y - uh.y) < 30) {
                if (window.SoundManager) window.SoundManager.collect();
                uh.collected = true;
                if (window.ConvoyManager) {
                    window.ConvoyManager.addHero(convoi, uh.type, window.SKILL_NAMES, player);
                }
            }
        });
    }
};
