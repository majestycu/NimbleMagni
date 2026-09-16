window.WorldBoard = (function () {
    const PALETTES = {
        wilds: { a: '#14180f', b: '#1a2214', sideL: '#0c100a', sideR: '#080a07', wall: '#0b0b0d', accent: '#3f2a1c' },
        desert: { a: '#3a3224', b: '#4a3c28', sideL: '#2a2218', sideR: '#1c1610', wall: '#1a120e', accent: '#6b4a28' },
        jungle: { a: '#0c1a12', b: '#122218', sideL: '#07140c', sideR: '#050e0a', wall: '#0e0a08', accent: '#3f2e16' },
        highlands: { a: '#1c1816', b: '#2a2420', sideL: '#120e0c', sideR: '#0a0808', wall: '#2a1010', accent: '#7c2d12' },
        fortress: { a: '#120e0c', b: '#1a1412', sideL: '#0a0808', sideR: '#060404', wall: '#1a0808', accent: '#7c2d12' }
    };

    function diamond(ctx, cx, cy, hw, hh, fill) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx - hw, cy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
    }

    function drawIsoTile(ctx, x, y, size, pal, shade) {
        const hw = size / 2;
        const hh = size / 4;
        const cx = x + hw;
        const cy = y + hh;
        diamond(ctx, cx, cy, hw, hh, shade ? pal.b : pal.a);
        ctx.fillStyle = pal.sideL;
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx, cy + hh + 6);
        ctx.lineTo(cx - hw, cy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pal.sideR;
        ctx.beginPath();
        ctx.moveTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx, cy + hh + 6);
        ctx.lineTo(cx + hw, cy + 6);
        ctx.closePath();
        ctx.fill();
    }

    function deco(ctx, d, biome) {
        if (d.kind === 'tree') {
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(d.x - 4, d.y - 4, 8, 14);
            ctx.fillStyle = biome === 'jungle' ? '#166534' : '#1b4332';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y - 16, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = biome === 'jungle' ? '#22c55e' : '#3f6212';
            ctx.beginPath();
            ctx.ellipse(d.x + 6, d.y - 22, 11, 8, 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (d.kind === 'ruin') {
            ctx.fillStyle = '#57534e';
            ctx.fillRect(d.x - 10, d.y - 18, 20, 22);
            ctx.fillStyle = '#292524';
            ctx.fillRect(d.x - 4, d.y - 8, 8, 12);
        } else if (d.kind === 'cactus') {
            ctx.fillStyle = '#3f6212';
            ctx.fillRect(d.x - 3, d.y - 18, 6, 22);
            ctx.fillRect(d.x - 10, d.y - 12, 8, 4);
            ctx.fillRect(d.x + 2, d.y - 8, 8, 4);
        } else if (d.kind === 'dune') {
            ctx.fillStyle = 'rgba(180,140,70,0.55)';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 22, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (d.kind === 'web') {
            ctx.strokeStyle = 'rgba(226,232,240,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 16, 0, Math.PI * 1.2);
            ctx.stroke();
        } else if (d.kind === 'pillar') {
            ctx.fillStyle = '#78716c';
            ctx.fillRect(d.x - 5, d.y - 28, 10, 32);
            ctx.fillStyle = '#a8a29e';
            ctx.fillRect(d.x - 8, d.y - 32, 16, 6);
        } else if (d.kind === 'ember') {
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(d.x - 6, d.y - 10, 12, 14);
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(d.x, d.y - 14, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (d.kind === 'bone') {
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(d.x - 8, d.y - 2, 16, 4);
            ctx.fillRect(d.x - 3, d.y - 8, 6, 10);
        } else {
            ctx.fillStyle = '#52525b';
            ctx.fillRect(d.x - 5, d.y - 10, 10, 14);
            ctx.beginPath();
            ctx.arc(d.x, d.y - 10, 5, Math.PI, 0);
            ctx.fill();
        }
    }

    function generate(canvas, act) {
        const left = window.LEFT_PANEL_WIDTH || 220;
        const wall = window.Campaign.WALL_MARGIN;
        const list = [];
        const kinds = {
            wilds: ['tree', 'tree', 'ruin', 'tomb', 'bone'],
            desert: ['cactus', 'dune', 'ruin', 'bone'],
            jungle: ['tree', 'tree', 'web', 'pillar'],
            highlands: ['ruin', 'pillar', 'ember', 'bone'],
            fortress: ['pillar', 'ember', 'ruin', 'ember']
        }[act.biome] || ['tree'];
        let n = 16;
        let tries = 0;
        while (list.length < n && tries < 220) {
            tries++;
            const x = left + wall + 40 + Math.random() * (canvas.width - left - wall * 2 - 80);
            const y = wall + 40 + Math.random() * (canvas.height - wall * 2 - 80);
            const cx = left + (canvas.width - left) / 2;
            if (Math.hypot(x - cx, y - canvas.height / 2) < 110) continue;
            if (list.some(o => Math.hypot(o.x - x, o.y - y) < 70)) continue;
            list.push({ x, y, kind: kinds[Math.floor(Math.random() * kinds.length)] });
        }
        return list;
    }

    function draw(ctx, canvas, act, decorations, time) {
        const pal = PALETTES[act.biome] || PALETTES.wilds;
        const left = window.LEFT_PANEL_WIDTH || 220;
        const size = 48;
        ctx.fillStyle = '#070709';
        ctx.fillRect(left, 0, canvas.width - left, canvas.height);
        for (let y = -size; y < canvas.height + size; y += size / 2) {
            const row = Math.floor(y / (size / 2));
            for (let x = left - size; x < canvas.width + size; x += size) {
                const ox = x + (row % 2 ? size / 2 : 0);
                const shade = (Math.floor(ox / size) + row) % 2 === 0;
                drawIsoTile(ctx, ox, y, size, pal, shade);
            }
        }
        decorations.forEach(d => deco(ctx, d, act.biome));

        const wall = window.Campaign.WALL_MARGIN;
        ctx.fillStyle = pal.wall;
        ctx.fillRect(left, 0, canvas.width - left, wall);
        ctx.fillRect(left, canvas.height - wall, canvas.width - left, wall);
        ctx.fillRect(left, 0, wall, canvas.height);
        ctx.fillRect(canvas.width - wall, 0, wall, canvas.height);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(left + wall, wall, canvas.width - left - wall * 2, canvas.height - wall * 2);

        if (window.drawTorch) {
            window.drawTorch(left + wall + 14, wall + 14, time);
            window.drawTorch(canvas.width - wall - 14, wall + 14, time + 1);
            window.drawTorch(left + wall + 14, canvas.height - wall - 14, time + 2);
            window.drawTorch(canvas.width - wall - 14, canvas.height - wall - 14, time + 3);
        }
    }

    return { generate, draw };
})();
