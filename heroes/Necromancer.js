(function () {
    class Necromancer extends window.Hero {
        constructor() {
            super('NECROMANCER');
            this.color = '#2f1c3f';
            this.hp = 130;
            this.maxHp = 130;
            this.ultimateSkill = 'poisonnova';
            this.castMult = 1.2;
            this.minion = { angle: 0, distance: 26 };
            this.rebuildSkillPool();
        }

        update(dt) {
            super.update(dt);
            if (this.minion) this.minion.angle += dt * 4;
        }

        draw(ctx, isLeader) {
            super.draw(ctx, isLeader);
            if (!this.minion) return;
            const mx = this.x + Math.cos(this.minion.angle) * this.minion.distance;
            const my = this.y + Math.sin(this.minion.angle) * this.minion.distance;
            if (window.IsoGeom) {
                window.IsoGeom.prism(ctx, mx, my, 6, 3, 12, {
                    top: '#7c3aed', left: '#2e1065', right: '#5b21b6', edge: '#000'
                });
            } else {
                ctx.save();
                ctx.fillStyle = '#4c1d95';
                ctx.beginPath();
                ctx.arc(mx, my, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'bloodwave').toLowerCase();
            const aim = this.getAim(enemies, dir, 400);
            const self = this;

            if (this.tryUltimate()) {
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
                    window.SkillFx.pushProjectile(res, {
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(a) * 4.2,
                        vy: Math.sin(a) * 4.2,
                        damage: 6 * dmgMult,
                        radius: 10,
                        life: 1.4,
                        pierce: true,
                        hitEnemies: new Set(),
                        update(dt, list) {
                            window.SkillFx.integrate(this, dt);
                            this.life -= dt;
                            if (this.life <= 0) this.active = false;
                            (list || enemies || []).forEach(m => {
                                if (!m || m.hp <= 0 || this.hitEnemies.has(m)) return;
                                if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                    window.StatusEffects.dealDamage(m, this.damage);
                                    window.StatusEffects.applyPoison(m, 3.5, 6 * dmgMult);
                                    this.hitEnemies.add(m);
                                }
                            });
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.fillStyle = '#22c55e';
                            ctx.shadowColor = '#16a34a';
                            ctx.shadowBlur = 12;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                if (window.SoundManager) window.SoundManager.cast();
            }

            if (skill === 'decrepify' || skill === 'curse') {
                if (!this.canCastPrimary(1.8)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                const targets = window.SkillFx.nearestEnemies(this.x, this.y, enemies, 320);
                targets.slice(0, 5).forEach(m => {
                    window.StatusEffects.applyCurse(m, 4.5, 1.45);
                    window.StatusEffects.applyPoison(m, 4.5, 4 * dmgMult);
                });
                window.SkillFx.pushProjectile(res, {
                    x: this.x,
                    y: this.y,
                    vx: 0,
                    vy: 0,
                    life: 0.55,
                    radius: 40,
                    pierce: true,
                    visualOnlyCollision: true,
                    update(dt) { this.life -= dt; if (this.life <= 0) this.active = false; this.radius += dt * 90; },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(self.x, self.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            } else {
                // Blood Wave — pierces, damages all entered, heals necro %
                if (!this.canCastPrimary(1.55)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(aim) * 5.8,
                    vy: Math.sin(aim) * 5.8,
                    damage: 11 * dmgMult,
                    radius: 38,
                    angle: aim,
                    life: 1.35,
                    pierce: true,
                    hitEnemies: new Set(),
                    owner: this,
                    update(dt) {
                        window.SkillFx.integrate(this, dt);
                        this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        (enemies || window.EnemiesAct1 && window.EnemiesAct1.enemies || []).forEach(m => {
                            if (!m || m.hp <= 0 || this.hitEnemies.has(m)) return;
                            if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                const dealt = window.StatusEffects.dealDamage(m, this.damage);
                                this.hitEnemies.add(m);
                                if (this.owner) {
                                    const heal = dealt * 0.25;
                                    this.owner.hp = Math.min(this.owner.maxHp, this.owner.hp + heal);
                                    if (window.player) {
                                        window.player.hp = Math.min(window.player.maxHp, window.player.hp + heal * 0.5);
                                    }
                                    if (window.floatingTexts) {
                                        window.floatingTexts.push({
                                            x: this.owner.x,
                                            y: this.owner.y - 18,
                                            text: `+${heal.toFixed(0)}`,
                                            color: '#f87171',
                                            timer: 0.7
                                        });
                                    }
                                }
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = '#7f1d1d';
                        ctx.lineWidth = 12;
                        ctx.shadowColor = '#dc2626';
                        ctx.shadowBlur = 16;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, this.angle - 1.4, this.angle + 1.4);
                        ctx.stroke();
                        ctx.strokeStyle = '#fecaca';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 0.7, this.angle - 1.1, this.angle + 1.1);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            }

            res.forEach(p => bag.push(p));
            this.cycleSkill();
            return { projectiles: res };
        }
    }
    window.Necromancer = Necromancer;
})();
