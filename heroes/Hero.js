(function () {
    class Hero {
        constructor(type) {
            this.type = (type || 'HERO').toUpperCase();
            this.x = 0;
            this.y = 0;
            this.radius = 14;
            this.hp = 150;
            this.maxHp = 150;
            this.speed = 150;
            this.convoiIndex = 0;
            this.dir = 'DOWN';
            this.color = '#94a3b8';

            this.primaryTimer = 0;
            this.skillTimer = 0;
            this.ultimateTimer = 0;
            this.ultimateReady = false;
            this.ultimateFlashTimer = 0;
            this.activeSkillIndex = 0;
            this.skillPool = [];
            this.unlockedSkills = new Set();
            this.ultimateSkill = null;
            this.currentSkill = null;
            this.castMult = 1;

            const catalog = (window.SkillTreeCatalog && window.SkillTreeCatalog[this.type]) || [];
            catalog.forEach(node => {
                if (node.unlocked || node.kind === 'basic') this.unlockedSkills.add(node.id);
            });
            this.rebuildSkillPool();
        }

        rebuildSkillPool() {
            const catalog = (window.SkillTreeCatalog && window.SkillTreeCatalog[this.type]) || [];
            const basics = catalog.filter(n => n.kind === 'basic' && this.unlockedSkills.has(n.id)).map(n => n.id);
            const skills = catalog.filter(n => n.kind === 'skill' && this.unlockedSkills.has(n.id)).map(n => n.id);
            const ult = catalog.find(n => n.kind === 'ultimate' && this.unlockedSkills.has(n.id));
            this.skillPool = [...basics, ...skills];
            if (this.skillPool.length === 0 && basics.length === 0) {
                this.skillPool = catalog.filter(n => n.kind === 'basic').map(n => n.id);
            }
            this.ultimateSkill = ult ? ult.id : this.ultimateSkill;
            if (this.activeSkillIndex >= this.skillPool.length) this.activeSkillIndex = 0;
            this.currentSkill = this.skillPool[this.activeSkillIndex] || null;
        }

        unlockSkill(skillId) {
            this.unlockedSkills.add(skillId);
            this.rebuildSkillPool();
        }

        cycleSkill() {
            if (!this.skillPool.length) return;
            this.activeSkillIndex = (this.activeSkillIndex + 1) % this.skillPool.length;
            this.currentSkill = this.skillPool[this.activeSkillIndex];
        }

        update(deltaTime) {
            if (this.primaryTimer > 0) this.primaryTimer -= deltaTime;
            if (this.skillTimer > 0) this.skillTimer -= deltaTime;
            if (this.ultimateTimer > 0) this.ultimateTimer -= deltaTime;
            if (this.ultimateFlashTimer > 0) this.ultimateFlashTimer -= deltaTime;

            if ((window.partyLevel || 1) >= 3 && this.unlockedSkills.has(this.ultimateSkill)) {
                if (this.ultimateTimer <= 0 && !this.ultimateReady) {
                    this.ultimateReady = true;
                    this.ultimateFlashTimer = 0.5;
                }
            }
        }

        canCastPrimary(cd) {
            if (this.primaryTimer > 0) return false;
            this.primaryTimer = (cd || 1.2) * (this.castMult || 1);
            return true;
        }

        tryUltimate() {
            if (!this.ultimateReady || !this.ultimateSkill || !this.unlockedSkills.has(this.ultimateSkill)) return false;
            this.ultimateReady = false;
            this.ultimateTimer = 18;
            this.ultimateFlashTimer = 0.6;
            if (window.floatingTexts) {
                window.floatingTexts.push({
                    x: this.x,
                    y: this.y - 28,
                    text: `${this.type} ULT: ${this.ultimateSkill}`,
                    color: '#facc15',
                    timer: 1.8
                });
            }
            return true;
        }

        getAim(enemies, dir, range) {
            const list = window.SkillFx.nearestEnemies(this.x, this.y, enemies, range || 380);
            if (list.length) return Math.atan2(list[0].y - this.y, list[0].x - this.x);
            return window.SkillFx.dirAngle(dir, -Math.PI / 2);
        }

        syncDir(dir) {
            this.dir = window.SkillFx.dirString(dir, window.player);
        }

        draw(ctx, isLeader) {
            if (window.render8BitEntity) {
                window.render8BitEntity(ctx, this.x, this.y, this.type, (this.dir || 'DOWN').toLowerCase());
            } else {
                ctx.fillStyle = this.color || '#fff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.save();
            ctx.strokeStyle = isLeader ? '#facc15' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 12, this.y - 16, 24, 24);
            ctx.restore();

            const barW = 28;
            const barH = 4;
            const bx = this.x - barW / 2;
            const by = this.y - 24;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bx, by, barW, barH);
            const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(bx, by, barW * hpRatio, barH);
            ctx.restore();

            if (this.ultimateFlashTimer > 0) {
                ctx.save();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 20 + this.ultimateFlashTimer * 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        attack() {
            return { projectiles: [] };
        }
    }

    window.Hero = Hero;
})();
