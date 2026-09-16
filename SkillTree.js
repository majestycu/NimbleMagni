(function () {
    window.SkillTreeUI = {
        open: false,
        selectedHeroIndex: 0,

        toggle() {
            this.open = !this.open;
            if (this.open) this.selectedHeroIndex = 0;
        },

        spendPoint(hero, node) {
            if (!hero || !node) return false;
            if (hero.unlockedSkills.has(node.id)) return false;
            if (node.unlocked) {
                hero.unlockSkill(node.id);
                return true;
            }
            const cost = node.cost || 1;
            if ((window.skillPoints || 0) < cost) return false;
            window.skillPoints -= cost;
            hero.unlockSkill(node.id);
            if (window.floatingTexts) {
                window.floatingTexts.push({
                    x: hero.x,
                    y: hero.y - 24,
                    text: `Unlocked ${node.name}`,
                    color: '#facc15',
                    timer: 1.4
                });
            }
            return true;
        },

        handleClick(x, y, canvas) {
            if (!this.open || !window.convoi || !window.convoi.length) return false;
            const panelX = (canvas.width - 520) / 2;
            const panelY = (canvas.height - 360) / 2;
            if (x < panelX || x > panelX + 520 || y < panelY || y > panelY + 360) {
                this.open = false;
                return true;
            }
            // hero tabs
            window.convoi.forEach((h, i) => {
                const tx = panelX + 20 + i * 80;
                const ty = panelY + 44;
                if (x >= tx && x <= tx + 70 && y >= ty && y <= ty + 28) {
                    this.selectedHeroIndex = i;
                }
            });
            const hero = window.convoi[this.selectedHeroIndex];
            if (!hero) return true;
            const catalog = (window.SkillTreeCatalog && window.SkillTreeCatalog[hero.type]) || [];
            catalog.forEach((node, i) => {
                const nx = panelX + 30 + (i % 3) * 155;
                const ny = panelY + 100 + Math.floor(i / 3) * 100;
                if (x >= nx && x <= nx + 140 && y >= ny && y <= ny + 80) {
                    this.spendPoint(hero, node);
                }
            });
            return true;
        },

        draw(ctx, canvas) {
            if (!this.open) return;
            const panelX = (canvas.width - 520) / 2;
            const panelY = (canvas.height - 360) / 2;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#12121a';
            ctx.fillRect(panelX, panelY, 520, 360);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.strokeRect(panelX, panelY, 520, 360);

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SKILL TREE', panelX + 260, panelY + 28);
            ctx.fillStyle = '#a4b0be';
            ctx.font = '12px monospace';
            ctx.fillText(`Skill Points: ${window.skillPoints || 0}  |  click node to unlock  |  T / tap to close`, panelX + 260, panelY + 48);

            (window.convoi || []).forEach((h, i) => {
                const tx = panelX + 20 + i * 80;
                const ty = panelY + 58;
                ctx.fillStyle = i === this.selectedHeroIndex ? '#1d4ed8' : '#1f2937';
                ctx.fillRect(tx, ty, 70, 28);
                ctx.strokeStyle = '#93c5fd';
                ctx.strokeRect(tx, ty, 70, 28);
                ctx.fillStyle = '#fff';
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText((h.type || '?').slice(0, 7), tx + 35, ty + 18);
            });

            const hero = (window.convoi || [])[this.selectedHeroIndex];
            if (!hero) {
                ctx.restore();
                return;
            }
            const catalog = (window.SkillTreeCatalog && window.SkillTreeCatalog[hero.type]) || [];
            catalog.forEach((node, i) => {
                const nx = panelX + 30 + (i % 3) * 155;
                const ny = panelY + 110 + Math.floor(i / 3) * 100;
                const unlocked = hero.unlockedSkills.has(node.id) || node.unlocked;
                ctx.fillStyle = unlocked ? '#14532d' : '#27272a';
                ctx.fillRect(nx, ny, 140, 80);
                ctx.strokeStyle = unlocked ? '#4ade80' : '#71717a';
                ctx.strokeRect(nx, ny, 140, 80);
                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(node.name, nx + 8, ny + 18);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px monospace';
                const lines = (node.desc || '').match(/.{1,22}/g) || [];
                lines.slice(0, 3).forEach((ln, li) => ctx.fillText(ln, nx + 8, ny + 36 + li * 12));
                ctx.fillStyle = unlocked ? '#86efac' : '#fbbf24';
                ctx.fillText(unlocked ? 'OWNED' : `COST ${node.cost || 0}`, nx + 8, ny + 72);
            });
            ctx.restore();
        }
    };
})();
