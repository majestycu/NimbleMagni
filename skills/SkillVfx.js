window.SkillVfx = {
    lightning(x1, y1, x2, y2, life) {
        const bolts = [window.SkillFx.lightningBolt(x1, y1, x2, y2, 8, 22)];
        return {
            x: x2, y: y2, vx: 0, vy: 0, damage: 0, radius: 8, life: life || 0.28,
            pierce: true, visualOnlyCollision: true, bolts,
            update(dt) { this.life -= dt; if (this.life <= 0) this.active = false; },
            draw(ctx) {
                ctx.save();
                (this.bolts || []).forEach(pts => {
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 6;
                    ctx.shadowColor = '#0ea5e9';
                    ctx.shadowBlur = 18;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 0;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();
                });
                ctx.restore();
            }
        };
    }
};
