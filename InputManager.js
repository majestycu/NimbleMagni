window.InputManager = {
    keys: {},
    touchStartX: 0,
    touchStartY: 0,

    init(canvas, setDirectionCallback, togglePauseCallback) {
        window.addEventListener('keydown', e => {
            let k = e.key.toLowerCase();
            this.keys[k] = true;
            if (k === 'p' || k === ' ') {
                if (togglePauseCallback) togglePauseCallback();
                e.preventDefault();
            }
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.key.toLowerCase()] = false;
        });

        if (canvas) {
            canvas.addEventListener('touchstart', e => {
                if (e.touches.length > 0) {
                    let rect = canvas.getBoundingClientRect();
                    let x = e.touches[0].clientX - rect.left;
                    let y = e.touches[0].clientY - rect.top;
                    let pbX = canvas.width - 60;
                    let pbY = 15;
                    let pbW = 45;
                    let pbH = 40;
                    if (x >= pbX && x <= pbX + pbW && y >= pbY && y <= pbY + pbH) {
                        if (togglePauseCallback) togglePauseCallback();
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                }
            }, { passive: false });

            canvas.addEventListener('touchend', e => {
                if (e.changedTouches.length > 0) {
                    let dx = e.changedTouches[0].clientX - this.touchStartX;
                    let dy = e.changedTouches[0].clientY - this.touchStartY;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 20) setDirectionCallback(1, 0);
                        else if (dx < -20) setDirectionCallback(-1, 0);
                    } else {
                        if (dy > 20) setDirectionCallback(0, 1);
                        else if (dy < -20) setDirectionCallback(0, -1);
                    }
                }
            });
        }
    },

    update(dt) {
        if (this.keys['w'] || this.keys['arrowup']) {
            if (window.setDirection) window.setDirection(0, -1);
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            if (window.setDirection) window.setDirection(0, 1);
        } else if (this.keys['a'] || this.keys['arrowleft']) {
            if (window.setDirection) window.setDirection(-1, 0);
        } else if (this.keys['d'] || this.keys['arrowright']) {
            if (window.setDirection) window.setDirection(1, 0);
        }
    }
};