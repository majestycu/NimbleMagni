(function () {
    class Paladin extends window.Hero {
        constructor() {
            super('PALADIN');
            this.color = '#dcdcdc';
            this.hp = 170;
            this.maxHp = 170;
            this.ultimateSkill = 'massheal';
            this.castMult = 1.15;
            this.rebuildSkillPool();
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'blessedhammer').toLowerCase();
            const aim = this.getAim(enemies, dir, 380);
            const self = this;
            const targets = window.SkillFx.nearestEnemies(this.x, this.y, enemies, 380);
            const target = targets[0] || null;

            if (this.tryUltimate()) {
                (window.convoi || []).forEach(h => {
                    h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.35);
                });
                if (window.player) {
                    window.player.hp = Math.min(window.player.maxHp, window.player.hp + 40);
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x, y: this.y, vx: 0, vy: 0, life: 0.7, radius: 16,
                    pierce: true, visualOnlyCollision: true,
                    update(dt) {
                        this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        this.radius += dt * 160;
                        this.x = self.x; this.y = self.y;
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = '#facc15';
                        ctx.lineWidth = 5;
                        ctx.shadowColor = '#eab308';
                        ctx.shadowBlur = 18;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            }

            if (skill === 'heavenstrike') {
                if (!this.canCastPrimary(1.7)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                const tx = target ? target.x : this.x + Math.cos(aim) * 120;
                const ty = target ? target.y : this.y + Math.sin(aim) * 120;
                (enemies || []).forEach(m => {
                    if (m && m.hp > 0 && Math.hypot(m.x - tx, m.y - ty) < 40) {
                        window.StatusEffects.dealDamage(m, 14 * dmgMult);
                    }
                });
                window.SkillFx.pushProjectile(res, {
                    x: tx, y: ty, vx: 0, vy: 0, damage: 0, radius: 22, life: 0.4,
                    pierce: true, visualOnlyCollision: true,
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = 9;
                        ctx.shadowColor = '#d97706';
                        ctx.shadowBlur = 16;
                        ctx.beginPath();
                        ctx.moveTo(tx, ty - 150);
                        ctx.lineTo(tx, ty);
                        ctx.stroke();
                        ctx.fillStyle = '#fef08a';
                        ctx.beginPath();
                        ctx.arc(tx, ty, 18, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            } else {
                if (!this.canCastPrimary(1.35)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                [0, Math.PI].forEach(off => {
                    window.SkillFx.pushProjectile(res, {
                        x: this.x, y: this.y, vx: 0, vy: 0,
                        damage: 8 * dmgMult, radius: 12, life: 1.6, dist: 18, rot: off,
                        pierce: true, hitEnemies: new Set(),
                        update(dt) {
                            this.life -= dt;
                            if (this.life <= 0) this.active = false;
                            this.dist += dt * 70;
                            this.rot += dt * 6.5;
                            this.x = self.x + Math.cos(this.rot) * this.dist;
                            this.y = self.y + Math.sin(this.rot) * this.dist;
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
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.rot * 3);
                            ctx.fillStyle = '#fbbf24';
                            ctx.shadowColor = '#f59e0b';
                            ctx.shadowBlur = 8;
                            ctx.fillRect(-8, -12, 16, 9);
                            ctx.fillStyle = '#78350f';
                            ctx.fillRect(-2, -3, 4, 14);
                            ctx.restore();
                        }
                    });
                });
                if (window.SoundManager) window.SoundManager.slash();
            }

            res.forEach(p => bag.push(p));
            this.cycleSkill();
            return { projectiles: res };
        }
    }
    window.Paladin = Paladin;
})();
