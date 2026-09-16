(function () {
    class Warrior extends window.Hero {
        constructor() {
            super('WARRIOR');
            this.color = '#708090';
            this.hp = 180;
            this.maxHp = 180;
            this.ultimateSkill = 'battleshout';
            this.castMult = 1.1;
            this.rebuildSkillPool();
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'whirlwind').toLowerCase();
            const aim = this.getAim(enemies, dir, 320);
            const self = this;

            if (this.tryUltimate()) {
                (window.convoi || []).forEach(h => {
                    h.damageBuffTimer = 5;
                    h.castMult = Math.max(0.85, (h.castMult || 1) * 0.9);
                });
                if (window.player) {
                    const boots = (window.gameUpgrades && window.gameUpgrades.speedBoostCount) || 0;
                    window.player.speed = window.Campaign.PLAYER_SPEED * (1 + boots * 0.08) * 1.12;
                    if (window.player.vx !== 0) window.player.vx = Math.sign(window.player.vx) * window.player.speed;
                    if (window.player.vy !== 0) window.player.vy = Math.sign(window.player.vy) * window.player.speed;
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x, y: this.y, vx: 0, vy: 0, life: 0.7, radius: 20,
                    pierce: true, visualOnlyCollision: true,
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        this.radius += dt * 140;
                        this.x = self.x; this.y = self.y;
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(248, 250, 252, 0.8)';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                (enemies || []).forEach(m => {
                    if (m && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) < 110) {
                        window.StatusEffects.dealDamage(m, 10 * dmgMult);
                    }
                });
                if (window.SoundManager) window.SoundManager.slash();
            }

            if (skill === 'shockwave') {
                if (!this.canCastPrimary(1.7)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x, y: this.y,
                    vx: Math.cos(aim) * 7.2, vy: Math.sin(aim) * 7.2,
                    damage: 12 * dmgMult, radius: 26, angle: aim, life: 1.1,
                    pierce: true, hitEnemies: new Set(),
                    update(dt) {
                        window.SkillFx.integrate(this, dt); this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        (enemies || []).forEach(m => {
                            if (!m || m.hp <= 0 || this.hitEnemies.has(m)) return;
                            if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                window.StatusEffects.dealDamage(m, this.damage);
                                this.hitEnemies.add(m);
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = '#f1f5f9';
                        ctx.lineWidth = 6;
                        ctx.shadowColor = '#94a3b8';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, this.angle - 1.0, this.angle + 1.0);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            } else {
                if (!this.canCastPrimary(1.25)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                const radius = 68;
                (enemies || []).forEach(m => {
                    if (m && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) <= radius) {
                        window.StatusEffects.dealDamage(m, 9 * dmgMult);
                    }
                });
                window.SkillFx.pushProjectile(res, {
                    x: this.x, y: this.y, vx: 0, vy: 0, damage: 0, radius, life: 0.28, rot: 0,
                    pierce: true, visualOnlyCollision: true,
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        this.rot += dt * 24;
                        this.x = self.x; this.y = self.y;
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, this.rot, this.rot + Math.PI * 1.4);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.slash();
            }

            res.forEach(p => bag.push(p));
            this.cycleSkill();
            return { projectiles: res };
        }
    }
    window.Warrior = Warrior;
})();
