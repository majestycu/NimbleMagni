window.EnemyManager = (function() {
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = 24;
            this.height = 24;
            this.animTime = Math.random() * 10;
            
            if (type === 'bat') {
                this.hp = 1;
                this.maxHp = 1;
                this.speed = 2.2;
                this.radius = 10;
            } else if (type === 'skeleton') {
                this.hp = 2;
                this.maxHp = 2;
                this.speed = 1.2;
                this.radius = 12;
            } else if (type === 'shaman') {
                this.hp = 2;
                this.maxHp = 2;
                this.speed = 0.9;
                this.radius = 12;
                this.shootTimer = 0;
            } else if (type === 'butcher') {
                this.hp = 30;
                this.maxHp = 30;
                this.speed = 1.0;
                this.width = 48;
                this.height = 48;
                this.radius = 22;
                this.isBoss = true;
            }
            this.vx = 0;
            this.vy = 0;
        }

        update(targetX, targetY, dt) {
            this.animTime += dt * 8;
            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 1) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.type === 'bat') {
                let wingFlap = Math.sin(this.animTime * 3) * 6;
                ctx.fillStyle = '#8b5cf6';
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(-12, -8 + wingFlap);
                ctx.lineTo(-6, 4);
                ctx.lineTo(0, 2);
                ctx.lineTo(6, 4);
                ctx.lineTo(12, -8 + wingFlap);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-2, -3, 2, 2);
                ctx.fillRect(1, -3, 2, 2);
            } else if (this.type === 'skeleton') {
                ctx.fillStyle = '#e4e4e7';
                ctx.fillRect(-6, -10, 12, 12);
                ctx.fillStyle = '#09090b';
                ctx.fillRect(-4, -8, 3, 3);
                ctx.fillRect(1, -8, 3, 3);
                ctx.fillStyle = '#71717a';
                ctx.fillRect(-5, 2, 10, 10);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(8, -14, 3, 20);
            } else if (this.type === 'shaman') {
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(0, 0, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(-8, -8);
                ctx.lineTo(-14, -14);
                ctx.lineTo(-4, -10);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(8, -8);
                ctx.lineTo(14, -14);
                ctx.lineTo(4, -10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(-4, -3, 3, 3);
                ctx.fillRect(1, -3, 3, 3);
            } else if (this.type === 'butcher') {
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(-22, -22, 44, 44);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(-18, -22);
                ctx.lineTo(-26, -34);
                ctx.lineTo(-10, -22);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(18, -22);
                ctx.lineTo(26, -34);
                ctx.lineTo(10, -22);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(16, -18, 8, 24);
                ctx.fillStyle = '#71717a';
                ctx.fillRect(18, -22, 4, 6);
                ctx.fillStyle = '#000';
                ctx.fillRect(-24, -40, 48, 6);
                ctx.fillStyle = '#ef4444';
                let pct = Math.max(0, this.hp / this.maxHp);
                ctx.fillRect(-24, -40, 48 * pct, 6);
            }
            ctx.restore();
        }
    }

    return {
        Enemy: Enemy
    };
})();
