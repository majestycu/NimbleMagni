(function () {
    class Druid extends window.Hero {
        constructor() {
            super('DRUID');
            this.color = '#8b5a2b';
            this.hp = 140;
            this.maxHp = 140;
            this.ultimateSkill = 'cataclysm';
            this.castMult = 1.25;
            this.rebuildSkillPool();
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'entanglingroots').toLowerCase();
            const aim = this.getAim(enemies, dir, 400);

            if (this.tryUltimate()) {
                // Cataclysm: crack in a straight line + lingering fire DOT
                const length = 260;
                const steps = 8;
                for (let i = 1; i <= steps; i++) {
                    const cx = this.x + Math.cos(aim) * (i * (length / steps));
                    const cy = this.y + Math.sin(aim) * (i * (length / steps));
                    window.GroundZones.add({
                        kind: 'cataclysm',
                        x: cx,
                        y: cy,
                        radius: 28,
                        life: 3.5,
                        update(dt, list) {
                            list.forEach(m => {
                                if (m && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) <= this.radius) {
                                    window.StatusEffects.dealDamage(m, 8 * dmgMult * dt);
                                }
                            });
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.strokeStyle = '#78350f';
                            ctx.lineWidth = 4;
                            ctx.beginPath();
                            ctx.moveTo(this.x - 14, this.y);
                            ctx.lineTo(this.x + 14, this.y + 4);
                            ctx.stroke();
                            ctx.fillStyle = `rgba(249, 115, 22, ${0.35 + Math.sin(this.life * 10) * 0.1})`;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                if (window.SoundManager) window.SoundManager.cast();
            }

            if (skill === 'hurricane') {
                if (!this.canCastPrimary(2.2)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                const targets = window.SkillFx.nearestEnemies(this.x, this.y, enemies, 300);
                const hx = targets[0] ? targets[0].x : this.x + Math.cos(aim) * 110;
                const hy = targets[0] ? targets[0].y : this.y + Math.sin(aim) * 110;
                window.GroundZones.add({
                    kind: 'hurricane',
                    x: hx,
                    y: hy,
                    radius: 78,
                    life: 2.6,
                    rot: 0,
                    update(dt, list) {
                        this.rot += dt * 10;
                        list.forEach(m => {
                            if (!m || m.hp <= 0) return;
                            const d = Math.hypot(m.x - this.x, m.y - this.y);
                            if (d <= this.radius) {
                                window.StatusEffects.dealDamage(m, 10 * dmgMult * dt);
                                // mild pull
                                const ang = Math.atan2(this.y - m.y, this.x - m.x);
                                m.x += Math.cos(ang) * 28 * dt;
                                m.y += Math.sin(ang) * 28 * dt;
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        for (let b = 0; b < 4; b++) {
                            const base = this.rot + b * (Math.PI / 2);
                            ctx.strokeStyle = 'rgba(74, 222, 128, 0.75)';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * 0.85, base, base + 1.2);
                            ctx.stroke();
                        }
                        ctx.strokeStyle = 'rgba(187, 247, 208, 0.9)';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            } else {
                if (!this.canCastPrimary(1.4)) {
                    res.forEach(p => bag.push(p));
                    return { projectiles: res };
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(aim) * 6.5,
                    vy: Math.sin(aim) * 6.5,
                    damage: 7 * dmgMult,
                    radius: 10,
                    life: 1.8,
                    update(dt, list) {
                        window.SkillFx.integrate(this, dt);
                        this.life -= dt;
                        if (this.life <= 0) this.active = false;
                        (list || enemies || []).forEach(m => {
                            if (!m || m.hp <= 0) return;
                            if (Math.hypot(m.x - this.x, m.y - this.y) < this.radius + (m.radius || 10)) {
                                window.StatusEffects.dealDamage(m, this.damage);
                                window.StatusEffects.applySlow(m, 1.6, 0.25);
                                this.active = false;
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.fillStyle = '#65a30d';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#365314';
                        ctx.lineWidth = 2;
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
    window.Druid = Druid;
})();
