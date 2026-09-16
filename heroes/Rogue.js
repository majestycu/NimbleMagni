(function () {
    class Rogue extends window.Hero {
        constructor() {
            super('ROGUE');
            this.color = '#2d5a27';
            this.hp = 110;
            this.maxHp = 110;
            this.ultimateSkill = 'frostshot';
            this.castMult = 1.05;
            this.rebuildSkillPool();
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'arrowvolley').toLowerCase();
            const aim = this.getAim(enemies, dir, 420);
            const self = this;

            if (this.tryUltimate()) {
                for (let i = -2; i <= 2; i++) {
                    const a = aim + i * 0.18;
                    window.SkillFx.pushProjectile(res, {
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 10, vy: Math.sin(a) * 10,
                        damage: 9 * dmgMult, radius: 7, angle: a, life: 1.4,
                        update(dt, list) {
                            window.SkillFx.integrate(this, dt); this.life -= dt;
                            if (this.life <= 0) this.active = false;
                            (list || enemies || []).forEach(m => {
                                if (!m || m.hp <= 0) return;
                                if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                    window.StatusEffects.dealDamage(m, this.damage);
                                    window.StatusEffects.applySlow(m, 2.2, 0.3);
                                    this.active = false;
                                }
                            });
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.strokeStyle = '#7dd3fc';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(this.x, this.y);
                            ctx.lineTo(this.x - Math.cos(this.angle) * 18, this.y - Math.sin(this.angle) * 18);
                            ctx.stroke();
                            ctx.restore();
                        }
                    });
                }
                if (window.SoundManager) window.SoundManager.slash();
            }

            if (skill === 'shadowstep') {
                if (!this.canCastPrimary(2.4)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                const cloneX = this.x;
                const cloneY = this.y;
                const dash = 110;
                this.x += Math.cos(aim) * dash;
                this.y += Math.sin(aim) * dash;
                if (window.player && this === (window.convoi && window.convoi[0])) {
                    window.player.x = this.x;
                    window.player.y = this.y;
                }
                window.SkillFx.pushProjectile(res, {
                    x: cloneX, y: cloneY, vx: 0, vy: 0, life: 1.1, radius: 14,
                    pierce: true, visualOnlyCollision: true, alpha: 0.8,
                    update(dt) {
                        this.life -= dt;
                        this.alpha = Math.max(0, this.life);
                        if (this.life <= 0) this.active = false;
                        (enemies || []).forEach(m => {
                            if (m && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) < 40) {
                                window.StatusEffects.dealDamage(m, 4 * dmgMult * dt);
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha * 0.7;
                        if (window.IsoActor) {
                            window.IsoActor.drawHero(ctx, {
                                x: this.x, y: this.y, type: 'ROGUE', dir: 'DOWN', hp: 1, maxHp: 1
                            }, false);
                        }
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.slash();
            } else if (skill === 'penetratingshot') {
                if (!this.canCastPrimary(1.5)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x, y: this.y,
                    vx: Math.cos(aim) * 12, vy: Math.sin(aim) * 12,
                    damage: 11 * dmgMult, radius: 8, angle: aim, life: 1.5,
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
                        ctx.strokeStyle = '#22c55e';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.x - Math.cos(this.angle) * 24, this.y - Math.sin(this.angle) * 24);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            } else {
                if (!this.canCastPrimary(1.05)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                [-0.25, 0, 0.25].forEach(offset => {
                    const a = aim + offset;
                    window.SkillFx.pushProjectile(res, {
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 9.5, vy: Math.sin(a) * 9.5,
                        damage: 5.5 * dmgMult, radius: 6, angle: a, life: 1.2,
                        update(dt, list) {
                            window.SkillFx.integrate(this, dt); this.life -= dt;
                            if (this.life <= 0) this.active = false;
                            (list || enemies || []).forEach(m => {
                                if (!m || m.hp <= 0) return;
                                if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                    window.StatusEffects.dealDamage(m, this.damage);
                                    this.active = false;
                                }
                            });
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.strokeStyle = '#86efac';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(this.x, this.y);
                            ctx.lineTo(this.x - Math.cos(this.angle) * 15, this.y - Math.sin(this.angle) * 15);
                            ctx.stroke();
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
    window.Rogue = Rogue;
})();
