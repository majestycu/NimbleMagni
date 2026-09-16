window.WaveManager = {
    spawnTimer: 5,
    eliteTimer: 0,
    bossSpawned: false,
    bossDefeated: false,
    townPortal: null,

    update(dt, canvas, gameTime, kills, currentAct, leftPanelWidth, player, enemies, projectiles, chests, itemDrops, skillOrbs, xpGems, unclaimedHeroes, convoi, addFloatingText, gameOverCallback) {
        this.spawnTimer += dt;
        let currentSpawnInterval = Math.max(1.2, 2.5 - Math.floor(gameTime / 25) * 0.15);
        if (this.spawnTimer > currentSpawnInterval) {
            this.spawnTimer = 0;
            if (currentAct === 1 && window.EnemiesAct1) {
                window.EnemiesAct1.spawnAct1Enemy(canvas, gameTime, kills, leftPanelWidth);
            }
        }

        if (currentAct === 1 && kills >= 60 && !this.bossSpawned) {
            this.bossSpawned = true;
            if (window.EnemiesAct1) {
                window.EnemiesAct1.spawnAct1Boss(canvas);
            }
            addFloatingText({
                x: leftPanelWidth + (canvas.width - leftPanelWidth) / 2,
                y: canvas.height / 2,
                text: "THE BUTCHER A APARUT!",
                color: '#dc2626',
                timer: 3.0
            });
        }

        this.eliteTimer += dt;
        if (this.eliteTimer >= 45) {
            this.eliteTimer = 0;
            this.spawnEliteEnemy(canvas, currentAct, leftPanelWidth, enemies);
        }

        if (currentAct === 1 && window.EnemiesAct1) {
            window.EnemiesAct1.updateEnemiesAct1(player.x, player.y, dt, projectiles);
        }

        if (this.townPortal) {
            this.townPortal.angle += dt * 3;
            if (Math.hypot(player.x - this.townPortal.x, player.y - this.townPortal.y) < 35) {
                currentAct = 2;
                this.townPortal = null;
                addFloatingText({
                    x: player.x,
                    y: player.y - 30,
                    text: "BUN VENIT IN ACTUL 2: DESERT!",
                    color: '#facc15',
                    timer: 3.0
                });
                if (window.SoundManager) window.SoundManager.collect();
            }
        }
    },

    spawnEliteEnemy(canvas, currentAct, LEFT_PANEL_WIDTH, enemies) {
        let side = Math.floor(Math.random() * 4);
        let ex, ey;
        let margin = 50;
        if (side === 0) { ex = LEFT_PANEL_WIDTH + Math.random() * (canvas.width - LEFT_PANEL_WIDTH); ey = -margin; }
        else if (side === 1) { ex = LEFT_PANEL_WIDTH + Math.random() * (canvas.width - LEFT_PANEL_WIDTH); ey = canvas.height + margin; }
        else if (side === 2) { ex = LEFT_PANEL_WIDTH + margin; ey = Math.random() * canvas.height; }
        else { ex = canvas.width + margin; ey = Math.random() * canvas.height; }

        let types = ['bat', 'skeleton', 'shaman'];
        let type = types[Math.floor(Math.random() * types.length)];
        
        let enemy;
        try {
            let EnemyCtor = (window.EnemyManager && window.EnemyManager.Enemy) || window.Enemy;
            if (EnemyCtor) {
                enemy = new EnemyCtor(ex, ey, type);
            }
        } catch (err) {}

        if (!enemy) {
            enemy = {
                x: ex,
                y: ey,
                type: type,
                hp: 50,
                maxHp: 50,
                speed: 2,
                width: 32,
                height: 32,
                radius: 12,
                active: true,
                draw: function(ctx) {
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
        }
        
        let speedScale = currentAct === 2 ? 1.3 : 1.0;
        let hpScale = currentAct === 2 ? 1.5 : 1.0;
        
        enemy.isElite = true;
        enemy.maxHp = Math.round(enemy.maxHp * 3 * hpScale);
        enemy.hp = enemy.maxHp;
        enemy.speed = enemy.speed * speedScale;
        enemy.width *= 2;
        enemy.height *= 2;
        enemy.radius *= 2;
        enemy.guaranteedDrop = true;
        
        let originalDraw = enemy.draw;
        enemy.draw = function(ctx) { 
            ctx.save();
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(2, 2);
            let ox = this.x;
            let oy = this.y;
            this.x = 0;
            this.y = 0;
            if (originalDraw) originalDraw.call(this, ctx);
            this.x = ox;
            this.y = oy;
            ctx.restore();
            
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("ELITE", this.x, this.y - this.radius - 8);
        };
        
        if (enemies) enemies.push(enemy);
    }
};