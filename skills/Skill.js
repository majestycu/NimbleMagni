(function() {
    class Skill {
        constructor(x, y, vx, vy, damage, radius, life) {
            this.x = x;
            this.y = y;
            this.vx = vx || 0;
            this.vy = vy || 0;
            this.damage = damage || 1;
            this.radius = radius || 10;
            this.life = life !== undefined ? life : 2.0;
            this.active = true;
            this.hitEnemies = new Set();
        }

        update(deltaTime, enemies) {
            if (window.SkillFx) window.SkillFx.integrate(this, deltaTime);
            else {
                this.x += (this.vx || 0) * deltaTime * 60;
                this.y += (this.vy || 0) * deltaTime * 60;
            }
            this.life -= deltaTime;
            if (this.life <= 0) {
                this.active = false;
            }
            if (enemies) {
                this.checkCollision(enemies);
            }
        }

        checkCollision(enemies) {
            if (!enemies) return;
            enemies.forEach(m => {
                if (m && m.hp > 0 && !this.hitEnemies.has(m)) {
                    const dist = Math.hypot(m.x - this.x, m.y - this.y);
                    if (dist < this.radius + (m.radius || 10)) {
                        m.hp -= this.damage;
                        this.hitEnemies.add(m);
                    }
                }
            });
        }

        draw(ctx) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class ProjectileSkill extends Skill {
        constructor(x, y, vx, vy, damage, radius, life, color) {
            super(x, y, vx, vy, damage, radius, life);
            this.color = color || '#facc15';
        }

        draw(ctx) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class GroundEffectSkill extends Skill {
        constructor(x, y, radius, life, damagePerSec, color) {
            super(x, y, 0, 0, damagePerSec, radius, life);
            this.color = color || 'rgba(74, 222, 128, 0.5)';
        }

        update(deltaTime, enemies) {
            this.life -= deltaTime;
            if (this.life <= 0) {
                this.active = false;
            }
            if (enemies) {
                enemies.forEach(m => {
                    if (m && m.hp > 0) {
                        const dist = Math.hypot(m.x - this.x, m.y - this.y);
                        if (dist <= this.radius) {
                            m.hp -= this.damage * deltaTime;
                        }
                    }
                });
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    window.Skill = Skill;
    window.ProjectileSkill = ProjectileSkill;
    window.GroundEffectSkill = GroundEffectSkill;
})();