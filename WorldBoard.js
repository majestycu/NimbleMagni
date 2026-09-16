window.WorldBoard = (function () {
    const PALETTES = {
        wilds: {
            floorTop: '#2f4a22', floorLeft: '#1b2a16', floorRight: '#24351c',
            wallTop: '#5c4033', wallLeft: '#1a1410', wallRight: '#3a2a1a',
            accent: '#365314', rim: '#1a1410'
        },
        desert: {
            floorTop: '#c4a35a', floorLeft: '#6e5a38', floorRight: '#8a7348',
            wallTop: '#a2844a', wallLeft: '#3a2a18', wallRight: '#6e5a38',
            accent: '#c4a35a', rim: '#3a2a18'
        },
        jungle: {
            floorTop: '#1d4a28', floorLeft: '#0f2818', floorRight: '#163820',
            wallTop: '#3f6b2a', wallLeft: '#1a140e', wallRight: '#2a2014',
            accent: '#166534', rim: '#1a140e'
        },
        highlands: {
            floorTop: '#4a3020', floorLeft: '#2a1210', floorRight: '#3a322c',
            wallTop: '#7c3a1a', wallLeft: '#1c1614', wallRight: '#3a2418',
            accent: '#7c3a1a', rim: '#2a1210'
        },
        fortress: {
            floorTop: '#3a1810', floorLeft: '#120c0a', floorRight: '#2a1c18',
            wallTop: '#7c2d12', wallLeft: '#2a0e0e', wallRight: '#3a1810',
            accent: '#ea580c', rim: '#2a0e0e'
        }
    };

    const FLOOR_Z = 5;
    const WALL_Z = 36;
    const TILE_HW = 28;
    const TILE_HH = 14;

    function palOf(act) {
        return PALETTES[(act && act.biome) || 'wilds'] || PALETTES.wilds;
    }

    function fillRect(walk, c0, r0, c1, r1) {
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                if (r >= 0 && c >= 0 && r < walk.length && c < walk[0].length) walk[r][c] = 1;
            }
        }
    }

    function corridor(walk, c0, r0, c1, r1) {
        let c = c0;
        let r = r0;
        const dc = Math.sign(c1 - c0) || 0;
        const dr = Math.sign(r1 - r0) || 0;
        while (c !== c1) {
            if (r >= 0 && c >= 0 && r < walk.length && c < walk[0].length) walk[r][c] = 1;
            c += dc;
        }
        while (r !== r1) {
            if (r >= 0 && c >= 0 && r < walk.length && c < walk[0].length) walk[r][c] = 1;
            r += dr;
        }
        if (r1 >= 0 && c1 >= 0 && r1 < walk.length && c1 < walk[0].length) walk[r1][c1] = 1;
    }

    function cellCenter(board, c, r) {
        return {
            x: board.ox + (c + 0.5) * board.cw,
            y: board.oy + (r + 0.5) * board.ch
        };
    }

    function generate(canvas, act) {
        const left = (window.LEFT_PANEL_WIDTH || 220) + ((window.Campaign && window.Campaign.WALL_MARGIN) || 32);
        const top = (window.Campaign && window.Campaign.WALL_MARGIN) || 32;
        const width = canvas.width - left - ((window.Campaign && window.Campaign.WALL_MARGIN) || 32);
        const height = canvas.height - top * 2;
        const cols = 11;
        const rows = 7;
        const cw = width / cols;
        const ch = height / rows;
        const walk = Array.from({ length: rows }, () => Array(cols).fill(0));
        const midC = 5;
        const midR = 3;
        fillRect(walk, 4, 0, 6, 6);
        fillRect(walk, 3, 2, 7, 4);
        fillRect(walk, 0, 0, 2, 1);
        fillRect(walk, 8, 0, 10, 1);
        fillRect(walk, 0, 5, 2, 6);
        fillRect(walk, 8, 5, 10, 6);
        corridor(walk, 1, 1, 5, 3);
        corridor(walk, 9, 1, 5, 3);
        corridor(walk, 1, 5, 5, 3);
        corridor(walk, 9, 5, 5, 3);

        if ((act && act.id) >= 4) {
            walk[midR][3] = 0;
            walk[midR][7] = 0;
        }

        const board = { cols, rows, cw, ch, ox: left, oy: top, walk, biome: (act && act.biome) || 'wilds', decorations: [] };
        const spawn = cellCenter(board, midC, midR);
        board.spawn = spawn;

        const ring = {
            wilds: 'tree',
            desert: 'cactus',
            jungle: 'tree',
            highlands: 'ruin',
            fortress: 'pillar'
        }[board.biome] || 'tree';
        const accent = {
            wilds: 'tomb',
            desert: 'dune',
            jungle: 'web',
            highlands: 'ember',
            fortress: 'ember'
        }[board.biome] || 'tomb';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!walk[r][c]) continue;
                if (c === midC && r === midR) continue;
                const p = cellCenter(board, c, r);
                if ((c + r * 3) % 5 === 0) board.decorations.push({ x: p.x, y: p.y, kind: ring, c, r });
                else if ((c * 2 + r) % 7 === 0) board.decorations.push({ x: p.x, y: p.y, kind: accent, c, r });
            }
        }
        return board;
    }

    function hitsWall(x, y, board) {
        if (!board || !board.walk) return false;
        const c = Math.floor((x - board.ox) / board.cw);
        const r = Math.floor((y - board.oy) / board.ch);
        if (r < 0 || c < 0 || r >= board.rows || c >= board.cols) return true;
        return board.walk[r][c] !== 1;
    }

    function deco(ctx, d, biome) {
        const G = window.IsoGeom;
        if (!G) return;
        ctx.save();
        G.diamond(ctx, d.x, d.y + 4, 10, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        if (d.kind === 'tree') {
            G.prism(ctx, d.x, d.y, 4, 2, 10, { top: '#3a2a1c', left: '#1c1410', right: '#292016', edge: '#000' });
            G.prism(ctx, d.x, d.y - 10, 14, 8, 16, { top: biome === 'jungle' ? '#166534' : '#365314', left: '#14532d', right: '#1f3d18', edge: 'rgba(0,0,0,0.4)' });
        } else if (d.kind === 'pillar') {
            G.prism(ctx, d.x, d.y, 8, 4, 28, { top: '#a8a29e', left: '#44403c', right: '#78716c', edge: '#000' });
        } else if (d.kind === 'ruin') {
            G.prism(ctx, d.x, d.y, 12, 6, 18, { top: '#78716c', left: '#292524', right: '#57534e', edge: '#000' });
        } else if (d.kind === 'cactus') {
            G.prism(ctx, d.x, d.y, 4, 2, 20, { top: '#65a30d', left: '#3f6212', right: '#4d7c0f', edge: '#000' });
        } else if (d.kind === 'dune') {
            G.prism(ctx, d.x, d.y, 16, 6, 8, { top: '#e7d3a8', left: '#a2844a', right: '#c4a35a', edge: 'rgba(0,0,0,0.2)' });
        } else if (d.kind === 'ember') {
            G.prism(ctx, d.x, d.y, 8, 4, 12, { top: '#f97316', left: '#7f1d1d', right: '#c2410c', edge: '#000' });
        } else if (d.kind === 'web') {
            ctx.strokeStyle = 'rgba(220,220,230,0.4)';
            ctx.beginPath();
            ctx.arc(d.x, d.y - 8, 12, 0, Math.PI * 1.2);
            ctx.stroke();
        } else {
            G.prism(ctx, d.x, d.y, 6, 3, 12, { top: '#a8a29e', left: '#44403c', right: '#78716c', edge: '#000' });
        }
        ctx.restore();
    }

    function drawFloor(ctx, canvas, act, board) {
        const pal = palOf(act);
        const left = window.LEFT_PANEL_WIDTH || 220;
        ctx.fillStyle = pal.wallLeft;
        ctx.fillRect(left, 0, canvas.width - left, canvas.height);

        if (!board || !board.walk) return;
        const G = window.IsoGeom;
        const hw = 34;
        const hh = 17;
        let row = 0;
        const y1 = board.oy + board.rows * board.ch + hh;
        const x1 = board.ox + board.cols * board.cw + hw * 2;
        for (let y = board.oy - hh; y < y1; y += hh, row++) {
            for (let x = board.ox - hw * 2; x < x1; x += hw * 2) {
                const cx = x + (row % 2 ? hw : 0);
                const cy = y;
                if (hitsWall(cx, cy, board)) continue;
                G.prism(ctx, cx, cy, hw + 1, hh + 0.5, FLOOR_Z, {
                    top: (Math.floor(cx / 8) + row) % 2 ? pal.floorTop : pal.floorRight,
                    left: pal.floorLeft,
                    right: pal.floorRight,
                    edge: 'rgba(0,0,0,0.22)'
                });
            }
        }
    }

    function collectWalls(board, act) {
        const pal = palOf(act);
        const G = window.IsoGeom;
        const list = [];
        if (!board || !board.walk) return list;
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                if (board.walk[r][c]) continue;
                const p = cellCenter(board, c, r);
                const x = board.ox + c * board.cw;
                const y = board.oy + r * board.ch;
                list.push({
                    y: p.y,
                    draw(ctx) {
                        ctx.fillStyle = pal.wallLeft;
                        ctx.fillRect(x, y, board.cw + 1, board.ch + 1);
                        G.prism(ctx, p.x, p.y + board.ch * 0.18, board.cw * 0.42, board.ch * 0.22, WALL_Z, {
                            top: pal.wallTop,
                            left: pal.wallLeft,
                            right: pal.wallRight,
                            edge: 'rgba(0,0,0,0.45)'
                        });
                    }
                });
            }
        }
        (board.decorations || []).forEach(d => {
            list.push({
                y: d.y,
                draw(ctx) { deco(ctx, d, board.biome); }
            });
        });
        return list;
    }

    function drawRim(ctx, canvas, act, time) {
        const pal = palOf(act);
        const left = window.LEFT_PANEL_WIDTH || 220;
        const wall = (window.Campaign && window.Campaign.WALL_MARGIN) || 32;
        ctx.fillStyle = pal.rim;
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

    function draw(ctx, canvas, act, boardOrDecor, time, sprites) {
        const board = boardOrDecor && boardOrDecor.walk ? boardOrDecor : window.board;
        drawFloor(ctx, canvas, act, board);
        const layered = collectWalls(board, act).concat(sprites || []);
        layered.sort((a, b) => a.y - b.y);
        layered.forEach(s => s.draw(ctx));
        drawRim(ctx, canvas, act, time || 0);
    }

    return { generate, draw, hitsWall, cellCenter, collectWalls, drawFloor };
})();
