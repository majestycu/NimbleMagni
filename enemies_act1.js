window.EnemiesAct1 = (function() {
    let enemies = [];

    function spawnAct1Enemy(canvas, gameTime, kills) {
        if (kills >= 60) return;
        let waveTier = Math.floor(gameTime / 15);
        let maxAllowed = 6 + waveTier * 4;
        let maxEnemies = Math.min(30, maxAllowed);
        if (enemies.length >= maxEnemies) return;

        let side = Math.floor(Math.random() * 4);
        let ex, ey;
        let margin = 50;
        if (side === 0) { ex = Math.random() * canvas.width; ey = -margin; }
        else if (side === 1) { ex = Math.random() * canvas.width; ey = canvas.height + margin; }
        else if (side === 2) { ex = -margin; ey = Math.random() * canvas.height; }
        else { ex = canvas.width + margin; ey = Math.random() * canvas.height; }

        let types = ['zombie'];
        if (waveTier >= 1) types.push('fallen');
        if (waveTier >= 2) types.push('quill_rat');
        if (waveTier >= 1) types.push('fallen_shaman');

        let type = types[Math.floor(Math.random() * types.length)];
        let baseSpd = 1.5;
        let baseHp = 30;

        let enemy = {
            x: ex,
            y: ey,
            type: type,
            speed: baseSpd,
            baseSpeed: baseSpd,
            radius: 12,
            hp: baseHp,
            maxHp: baseHp,
            slowTimer: 0,
            panicTimer: 0,
            shootTimer: 0
        };

        if (type === 'zombie') {
            enemy.speed = baseSpd * 0.4;
            enemy.baseSpeed = enemy.speed;
            enemy.maxHp = baseHp * 3;
            enemy.hp = enemy.maxHp;
            enemy.radius = 14;
        } else if (type === 'fallen') {
            enemy.speed = baseSpd * 1.25;
            enemy.baseSpeed = enemy.speed;
            enemy.maxHp = 15;
            enemy.hp = 15;
            enemy.radius = 9;
        } else if (type === 'fallen_shaman') {
            enemy.speed = baseSpd * 0.9;
            enemy.baseSpeed = enemy.speed;
            enemy.maxHp = 45;
            enemy.hp = 45;
            enemy.radius = 11;
        } else if (type === 'quill_rat') {
            enemy.speed = baseSpd * 1.0;
            enemy.baseSpeed = enemy.speed;
            enemy.maxHp = 35;
            enemy.hp = 35;
            enemy.radius = 11;
        }

        let elapsed25sCount = Math.floor(gameTime / 25);
        let speedScale = Math.min(1.6, 1.0 + elapsed25sCount * 0.05);
        let hpScale = 1.0 + elapsed25sCount * 0.15;
        
        enemy.maxHp = Math.round(enemy.maxHp * hpScale);
        enemy.hp = enemy.maxHp;
        enemy.speed = enemy.speed * speedScale;
        enemy.baseSpeed = enemy.baseSpeed * speedScale;

        enemies.push(enemy);
    }

    function spawnAct1Boss(canvas) {
        let boss = {
            x: canvas.width / 2,
            y: 100,
            type: 'butcher',
            isBoss: true,
            speed: 1.2,
            baseSpeed: 1.2,
            radius: 22,
            maxHp: 500,
            hp: 500
        };
        enemies.push(boss);
    }

    function updateEnemiesAct1(px, py, dt, projectiles) {
        enemies.forEach(e => {
            if (e.slowTimer > 0) {
                e.slowTimer -= dt;
                if (e.slowTimer <= 0 && e.baseSpeed !== undefined) {
                    e.speed = e.baseSpeed;
                }
            }
            let angle = Math.atan2(py - e.y, px - e.x);
            if (e.type === 'quill_rat') {
                let dist = Math.hypot(px - e.x, py - e.y);
                if (dist < 120) {
                    e.x -= Math.cos(angle) * e.speed * dt * 30;
                    e.y -= Math.sin(angle) * e.speed * dt * 30;
                } else if (dist > 160) {
                    e.x += Math.cos(angle) * e.speed * dt * 30;
                    e.y += Math.sin(angle) * e.speed * dt * 30;
                }
                e.shootTimer = (e.shootTimer || 0) + dt;
                if (e.shootTimer >= 3.0) {
                    e.shootTimer = 0;
                    if (projectiles) {
                        projectiles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            radius: 3,
                            color: '#8b5a2b',
                            isEnemy: true,
                            active: true
                        });
                    }
                }
            } else {
                e.x += Math.cos(angle) * e.speed * dt * 30;
                e.y += Math.sin(angle) * e.speed * dt * 30;
                if (e.type === 'fallen_shaman') {
                    e.shootTimer = (e.shootTimer || 0) + dt;
                    if (e.shootTimer >= 4.0) {
                        e.shootTimer = 0;
                        if (projectiles) {
                            projectiles.push({
                                x: e.x,
                                y: e.y,
                                vx: Math.cos(angle) * 3.5,
                                vy: Math.sin(angle) * 3.5,
                                radius: 5,
                                color: '#dc2626',
                                isEnemy: true,
                                active: true
                            });
                        }
                    }
                }
            }
        });
    }

    function renderEnemiesAct1(ctx, canvas, gameTime) {
        enemies.forEach(enemy => {
            ctx.save();
            if (enemy.isBoss) {
                let pulse = Math.sin(gameTime * 10) * 6;
                let grad = ctx.createRadialGradient(enemy.x, enemy.y, enemy.radius, enemy.x, enemy.y, enemy.radius + 14 + pulse);
                grad.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
                grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius + 14 + pulse, 0, Math.PI * 2);
                ctx.fill();

                if (window.renderEntitySprite) {
                    window.renderEntitySprite(ctx, this.x || enemy.x, this.y || enemy.y, this.type || enemy.type);
                }

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("THE BUTCHER", enemy.x, enemy.y - enemy.radius - 12);
            } else {
                if (window.renderEntitySprite) {
                    window.renderEntitySprite(ctx, this.x || enemy.x, this.y || enemy.y, this.type || enemy.type);
                }
            }
            ctx.restore();

            if (enemy.hp < enemy.maxHp && !enemy.isBoss) {
                let barW = 20;
                let barH = 3;
                let bx = enemy.x - barW / 2;
                let by = enemy.y - enemy.radius - 6;
                ctx.fillStyle = '#450a0a';
                ctx.fillRect(bx, by, barW, barH);
                ctx.fillStyle = '#00ff44';
                let r = Math.max(0, enemy.hp / enemy.maxHp);
                ctx.fillRect(bx, by, barW * r, barH);
            }
        });

        let bossActive = enemies.find(e => e.isBoss);
        if (bossActive) {
            let bBarW = 240;
            let bBarH = 10;
            let bBx = (canvas.width - bBarW) / 2;
            let bBy = canvas.height - 35;
            ctx.fillStyle = '#000';
            ctx.fillRect(bBx - 2, bBy - 2, bBarW + 4, bBarH + 4);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(bBx, bBy, bBarW, bBarH);
            ctx.fillStyle = '#facc15';
            let bRatio = Math.max(0, bossActive.hp / bossActive.maxHp);
            ctx.fillRect(bBx, bBy, bBarW * bRatio, bBarH);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.strokeRect(bBx, bBy, bBarW, bBarH);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("THE BUTCHER", canvas.width / 2, bBy - 6);
        }
    }

    return {
        get enemies() { return enemies; },
        set enemies(val) { enemies = val; },
        spawnAct1Enemy,
        spawnAct1Boss,
        updateEnemiesAct1,
        renderEnemiesAct1
    };
})();
