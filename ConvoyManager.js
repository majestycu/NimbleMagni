window.ConvoyManager = {
    updateConvoy(player, trail, convoi, TRAIL_SPACING, dt) {
        trail.unshift({ x: player.x, y: player.y });
        if (trail.length > 2000) trail.pop();

        let currentTrailIdx = 0;
        let cumulativeDist = 0;
        convoi.forEach((hero, index) => {
            if (index === 0) {
                hero.x = player.x;
                hero.y = player.y;
            } else {
                const targetDist = index * TRAIL_SPACING;
                while (currentTrailIdx < trail.length - 1 && cumulativeDist < targetDist) {
                    const p1 = trail[currentTrailIdx];
                    const p2 = trail[currentTrailIdx + 1];
                    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    if (cumulativeDist + d >= targetDist) {
                        const ratio = (targetDist - cumulativeDist) / d;
                        hero.x = p1.x + (p2.x - p1.x) * ratio;
                        hero.y = p1.y + (p2.y - p1.y) * ratio;
                        cumulativeDist = targetDist;
                        break;
                    }
                    cumulativeDist += d;
                    currentTrailIdx++;
                }
                if (cumulativeDist < targetDist) {
                    const last = trail[trail.length - 1] || player;
                    hero.x = last.x;
                    hero.y = last.y;
                }
            }

            if (window.SkillFx) {
                hero.dir = window.SkillFx.dirString(player.dir, player);
            } else if (typeof player.dir === 'string') {
                hero.dir = player.dir;
            } else if (player.dir && typeof player.dir === 'object') {
                if (Math.abs(player.dir.x) > Math.abs(player.dir.y)) {
                    hero.dir = player.dir.x < 0 ? 'LEFT' : 'RIGHT';
                } else {
                    hero.dir = player.dir.y < 0 ? 'UP' : 'DOWN';
                }
            }
            // NOTE: do not call hero.update here — GameEngine owns timers
        });
    },

    addHero(convoi, type, skillNames, player) {
        const currentTypes = convoi.map(h => (h.type || '').toUpperCase());
        let typeName = type.toUpperCase() === 'NECRO' ? 'NECROMANCER' : type.toUpperCase();
        if (currentTypes.includes(typeName)) return false;
        const h = window.HeroFactory
            ? window.HeroFactory.createHero(typeName)
            : new window.Hero(typeName);
        h.type = typeName;
        h.currentSkill = skillNames && skillNames[typeName] ? skillNames[typeName][0] : h.skillPool[0];
        convoi.push(h);
        if (player) {
            player.maxHp = (player.maxHp || 100) + 30;
            player.hp = Math.min(player.maxHp, (player.hp || 100) + 30);
        }
        return true;
    },

    initMovement(player) {
        if (!player) return;
        if (player.vx === undefined || (player.vx === 0 && player.vy === 0)) {
            player.vx = 0;
            player.vy = -(player.speed || 3);
        }
        if (player.dir === undefined) {
            player.dir = { x: 0, y: -1 };
        }
    }
};
