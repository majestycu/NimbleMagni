(function () {
    class Mage extends window.Hero {
        constructor() {
            super('MAGE');
            this.color = '#27408b';
            this.hp = 120;
            this.maxHp = 120;
            this.ultimateSkill = 'blizzard';
            this.castMult = 1.15;
            this.rebuildSkillPool();
        }

        attack(px, py, enemies, projectilesList, dir) {
            this.syncDir(dir);
            const res = [];
            const bag = projectilesList || window.projectiles || [];
            const dmgMult = (window.partyLevel || 1) >= 2 ? 1.3 : 1.0;
            const skill = (this.skillPool[this.activeSkillIndex] || 'chainlightning').toLowerCase();
            const aim = this.getAim(enemies, dir, 420);

            const castUlt = () => {
                if (!this.tryUltimate()) return;
                const zoneX = this.x + Math.cos(aim) * 90;
                const zoneY = this.y + Math.sin(aim) * 90;
                window.GroundZones.add({
                    kind: 'blizzard',
                    x: zoneX,
                    y: zoneY,
                    radius: 95,
                    life: 4.5,
                    tick: 0,
                    update(dt, list) {
                        this.tick += dt;
                        list.forEach(m => {
                            if (!m || m.hp <= 0) return;
                            if (Math.hypot(m.x - this.x, m.y - this.y) <= this.radius) {
                                window.StatusEffects.applySlow(m, 0.4, 0.35);
                                window.StatusEffects.dealDamage(m, 9 * dmgMult * dt);
                            }
                        });
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.fillStyle = 'rgba(125, 211, 252, 0.18)';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        for (let i = 0; i < 18; i++) {
                            const a = (i / 18) * Math.PI * 2 + this.life;
                            const r = this.radius * (0.2 + (i % 5) * 0.15);
                            const px2 = this.x + Math.cos(a) * r;
                            const py2 = this.y + Math.sin(a * 1.3) * r * 0.7;
                            ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(186,230,253,0.8)';
                            ctx.fillRect(px2, py2, 2, 6);
                        }
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            };

            if (skill === 'meteor') {
                if (!this.canCastPrimary(2.0)) return { projectiles: res };
                const targets = window.SkillFx.nearestEnemies(this.x, this.y, enemies, 420);
                const t = targets[0];
                const tx = t ? t.x : this.x + Math.cos(aim) * 140;
                const ty = t ? t.y : this.y + Math.sin(aim) * 140;
                window.SkillFx.pushProjectile(res, {
                    x: tx,
                    y: ty - 220,
                    vx: 0,
                    vy: 0,
                    targetX: tx,
                    targetY: ty,
                    damage: 18 * dmgMult,
                    radius: 16,
                    life: 1.2,
                    fallSpeed: 260,
                    pierce: true,
                    visualOnlyCollision: true,
                    update(dt) {
                        this.y += this.fallSpeed * dt;
                        this.life -= dt;
                        if (this.y >= this.targetY || this.life <= 0) {
                            this.active = false;
                            (enemies || []).forEach(m => {
                                if (m && m.hp > 0 && Math.hypot(m.x - this.targetX, m.y - this.targetY) < 48) {
                                    window.StatusEffects.dealDamage(m, this.damage);
                                }
                            });
                            window.GroundZones.add({
                                kind: 'meteor_fire',
                                x: this.targetX,
                                y: this.targetY,
                                radius: 52,
                                life: 3.2,
                                update(dt2, list) {
                                    list.forEach(m => {
                                        if (m && m.hp > 0 && Math.hypot(m.x - this.x, m.y - this.y) <= this.radius) {
                                            window.StatusEffects.dealDamage(m, 7 * dmgMult * dt2);
                                        }
                                    });
                                },
                                draw(ctx) {
                                    ctx.save();
                                    const pulse = 0.55 + Math.sin(this.life * 8) * 0.15;
                                    ctx.fillStyle = `rgba(220, 38, 38, ${0.25 * pulse})`;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.fillStyle = `rgba(249, 115, 22, ${0.4 * pulse})`;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.radius * 0.55, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.restore();
                                }
                            });
                        }
                    },
                    draw(ctx) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        ctx.arc(this.targetX, this.targetY, 28, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = '#7f1d1d';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#f97316';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fef08a';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            } else {
                // Chain Lightning = default basic attack
                if (!this.canCastPrimary(1.35)) return { projectiles: res };
                const pool = window.SkillFx.nearestEnemies(this.x, this.y, enemies, 520);
                const chain = [];
                let cx = this.x;
                let cy = this.y;
                const remaining = pool.slice();
                for (let i = 0; i < 4 && remaining.length; i++) {
                    remaining.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
                    const next = remaining.shift();
                    if (Math.hypot(next.x - cx, next.y - cy) > 260 && i > 0) break;
                    chain.push(next);
                    window.StatusEffects.dealDamage(next, 8 * dmgMult * (1 - i * 0.12));
                    cx = next.x;
                    cy = next.y;
                }
                const bolts = [];
                if (chain.length) {
                    let px0 = this.x;
                    let py0 = this.y;
                    chain.forEach(t => {
                        bolts.push(window.SkillFx.lightningBolt(px0, py0, t.x, t.y, 7, 22));
                        px0 = t.x;
                        py0 = t.y;
                    });
                } else {
                    const ex = this.x + Math.cos(aim) * 220;
                    const ey = this.y + Math.sin(aim) * 220;
                    bolts.push(window.SkillFx.lightningBolt(this.x, this.y, ex, ey, 7, 22));
                }
                window.SkillFx.pushProjectile(res, {
                    x: this.x,
                    y: this.y,
                    vx: 0,
                    vy: 0,
                    damage: 0,
                    radius: 8,
                    life: 0.28,
                    pierce: true,
                    visualOnlyCollision: true,
                    bolts,
                    flicker: 0,
                    update(dt) {
                        this.life -= dt;
                        this.flicker += dt;
                        if (this.life <= 0) this.active = false;
                        // regenerate bolt jitter for living animation
                        if (this.flicker > 0.05 && chain.length) {
                            this.flicker = 0;
                            const rebuilt = [];
                            let ax = this.x;
                            let ay = this.y;
                            chain.forEach(t => {
                                if (!t || t.hp === undefined) return;
                                rebuilt.push(window.SkillFx.lightningBolt(ax, ay, t.x, t.y, 6, 18));
                                ax = t.x;
                                ay = t.y;
                            });
                            if (rebuilt.length) this.bolts = rebuilt;
                        }
                    },
                    draw(ctx) {
                        ctx.save();
                        (this.bolts || []).forEach(pts => {
                            ctx.strokeStyle = '#38bdf8';
                            ctx.lineWidth = 7;
                            ctx.shadowColor = '#0ea5e9';
                            ctx.shadowBlur = 22;
                            ctx.beginPath();
                            ctx.moveTo(pts[0].x, pts[0].y);
                            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                            ctx.stroke();
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 2.5;
                            ctx.shadowBlur = 0;
                            ctx.beginPath();
                            ctx.moveTo(pts[0].x, pts[0].y);
                            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                            ctx.stroke();
                        });
                        ctx.restore();
                    }
                });
                if (window.SoundManager) window.SoundManager.cast();
            }

            castUlt();
            res.forEach(p => bag.push(p));
            this.cycleSkill();
            return { projectiles: res };
        }
    }
    window.Mage = Mage;
})();
