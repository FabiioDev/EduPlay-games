document.addEventListener('DOMContentLoaded', () => {
    // ===== ELEMENTOS DEL DOM =====
    const gameArea       = document.getElementById('game-area');
    const statusText     = document.getElementById('status-text');
    const levelDisplay   = document.getElementById('level-display');
    const movesDisplay   = document.getElementById('moves-display');
    const optimalDisplay = document.getElementById('optimal-display');
    const startBtn       = document.getElementById('start-btn');
    const postActions    = document.getElementById('post-level-actions');
    const continueBtn    = document.getElementById('continue-btn');
    const restartBtn     = document.getElementById('restart-btn');
    const winOverlay     = document.getElementById('win-overlay');
    const winEmoji       = document.getElementById('win-emoji');
    const winTitle       = document.getElementById('win-title');
    const winMessage     = document.getElementById('win-message');
    const winStars       = document.getElementById('win-stars');
    const winCloseBtn    = document.getElementById('win-close-btn');
    const winContinueBtn = document.getElementById('win-continue-btn');
    const winRestartBtn  = document.getElementById('win-restart-btn');

    // ===== ESTADO DEL JUEGO =====
    const MAX_LEVEL = 7;
    let currentLevel = 1;    // nivel 1 = 2 discos, nivel 7 = 7 discos
    let numDisks    = 2;
    let towers      = [[], [], []];  // torres[0..2]: pila de tamaños de disco
    let selectedTower = null;        // índice de la torre actualmente seleccionada
    let moves       = 0;
    let gameActive  = false;
    let showHints   = true;         // sólo nivel 1 muestra indicaciones

    // ===== AUDIO =====
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'pick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.linearRampToValueAtTime(700, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now); osc.stop(now + 0.12);
        } else if (type === 'drop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.linearRampToValueAtTime(280, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now); osc.stop(now + 0.18);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'win') {
            // Fanfarria ascendente
            [523, 659, 784, 1047].forEach((freq, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination);
                o.type = 'sine';
                o.frequency.value = freq;
                const t = now + i * 0.12;
                g.gain.setValueAtTime(0.25, t);
                g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
                o.start(t); o.stop(t + 0.3);
            });
        }
    }

    // ===== CÁLCULOS =====
    function optimalMoves(n) {
        return Math.pow(2, n) - 1;
    }

    function getStars(moves, optimal) {
        if (moves <= optimal) return 3;
        if (moves <= optimal * 1.5) return 2;
        return 1;
    }

    // ===== INICIALIZAR JUEGO =====
    function initGame() {
        numDisks      = currentLevel + 1;
        if (numDisks > 7) numDisks = 7;
        towers        = [[], [], []];
        selectedTower = null;
        moves         = 0;
        gameActive    = true;
        showHints     = currentLevel === 1;

        // Poner todos los discos en la primera torre (tamaño 1 = más grande)
        for (let i = numDisks; i >= 1; i--) {
            towers[0].push(i);
        }

        levelDisplay.textContent   = currentLevel;
        movesDisplay.textContent   = 0;
        optimalDisplay.textContent = optimalMoves(numDisks);

        statusText.textContent = showHints
            ? 'Selecciona una torre para mover el disco superior'
            : '';
        statusText.style.color = '';

        winOverlay.classList.add('hidden');
        postActions.classList.add('hidden');

        render();
    }

    // ===== RENDER =====
    function render() {
        gameArea.innerHTML = '';

        // Calcular altura del poste según el número de discos
        const diskH   = 28 + 3; // height + margin-bottom
        const poleH   = numDisks * diskH + 40;
        const maxDiskW = 88; // porcentaje máximo del ancho de la torre

        const towerLabels = ['Torre A', 'Torre B', 'Torre C (meta)'];

        towers.forEach((stack, tIdx) => {
            const towerEl = document.createElement('div');
            towerEl.classList.add('tower');
            towerEl.dataset.index = tIdx;
            towerEl.dataset.label = towerLabels[tIdx];

            // Aplicar clase visual según estado de selección
            if (selectedTower === tIdx) {
                towerEl.classList.add('drop-target');
            }

            // Poste
            const poleEl = document.createElement('div');
            poleEl.classList.add('tower-pole');
            poleEl.style.height = poleH + 'px';
            towerEl.appendChild(poleEl);

            // Pila de discos
            const stackEl = document.createElement('div');
            stackEl.classList.add('disk-stack');

            stack.forEach((size, dIdx) => {
                const diskEl = document.createElement('div');
                diskEl.classList.add('disk');
                diskEl.dataset.size = size;

                // Ancho proporcional al tamaño del disco
                const widthPct = 20 + (size / numDisks) * (maxDiskW - 20);
                diskEl.style.width = widthPct + '%';

                // Destacar el disco superior seleccionado
                if (selectedTower === tIdx && dIdx === stack.length - 1) {
                    diskEl.classList.add('selected');
                }

                stackEl.appendChild(diskEl);
            });

            towerEl.appendChild(stackEl);

            // Click handler
            towerEl.addEventListener('click', () => handleTowerClick(tIdx, towerEl));

            gameArea.appendChild(towerEl);
        });
    }

    // ===== LÓGICA DE MOVIMIENTO =====
    function handleTowerClick(tIdx, towerEl) {
        if (!gameActive) return;

        if (selectedTower === null) {
            // Intentar seleccionar
            if (towers[tIdx].length === 0) {
                flashShake(towerEl);
                playSound('error');
                if (showHints) statusText.textContent = 'Esa torre está vacía, elige otra';
                return;
            }
            selectedTower = tIdx;
            playSound('pick');
            if (showHints) statusText.textContent = 'Ahora elige dónde colocar el disco';
            else statusText.textContent = '';
            render();
        } else if (selectedTower === tIdx) {
            // Deseleccionar
            selectedTower = null;
            if (showHints) statusText.textContent = 'Selecciona una torre para mover el disco superior';
            else statusText.textContent = '';
            render();
        } else {
            // Intentar mover
            attemptMove(selectedTower, tIdx, towerEl);
        }
    }

    function attemptMove(from, to, toEl) {
        const fromStack = towers[from];
        const toStack   = towers[to];
        const diskToMove = fromStack[fromStack.length - 1];
        const topOfTarget = toStack.length > 0 ? toStack[toStack.length - 1] : Infinity;

        if (diskToMove < topOfTarget) {
            // Movimiento válido
            toStack.push(fromStack.pop());
            moves++;
            movesDisplay.textContent = moves;
            selectedTower = null;
            playSound('drop');
            render();
            checkWin();
        } else {
            // Movimiento inválido — este mensaje siempre se muestra
            flashShake(toEl);
            playSound('error');
            statusText.textContent = '⚠️ No puedes poner un disco grande sobre uno pequeño';
            statusText.style.color = '';
            // Mantener la selección para que pueda elegir otro destino
        }
    }

    function flashShake(el) {
        el.classList.remove('shake');
        void el.offsetWidth; // reflow para reiniciar animación
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    }

    // ===== COMPROBAR VICTORIA =====
    function checkWin() {
        if (towers[2].length === numDisks) {
            gameActive = false;
            const optimal = optimalMoves(numDisks);
            const stars   = getStars(moves, optimal);

            playSound('win');

            winEmoji.textContent = stars === 3 ? '🏆' : stars === 2 ? '🎉' : '✅';

            const isLastLevel = currentLevel >= MAX_LEVEL;
            winTitle.textContent = isLastLevel ? '🏆 ¡Eres un Maestro!' : '¡Nivel Completado!';

            const efficiency = Math.round((optimal / moves) * 100);
            winMessage.textContent = `${moves} movimientos (óptimo: ${optimal}) — Eficiencia: ${efficiency}%`;

            winStars.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const span = document.createElement('span');
                span.textContent = i < stars ? '⭐' : '☆';
                winStars.appendChild(span);
            }

            // Configurar botón Siguiente en el overlay
            if (isLastLevel) {
                winContinueBtn.innerHTML = '<span class="material-symbols-outlined">emoji_events</span> ¡Completado!';
                winContinueBtn.disabled  = true;
                winContinueBtn.style.opacity = '0.45';
            } else {
                winContinueBtn.innerHTML = '<span class="material-symbols-outlined">arrow_forward</span> Siguiente Nivel';
                winContinueBtn.disabled  = false;
                winContinueBtn.style.opacity = '1';
            }

            winOverlay.classList.remove('hidden');

            statusText.textContent = `¡Completado! ${stars === 3 ? '¡Solución perfecta! 🌟' : '¡Buen trabajo!'}`;
            statusText.style.color = '#FFD200';
        }
    }

    // ===== CERRAR OVERLAY =====
    function closeWinOverlay() {
        winOverlay.classList.add('hidden');
        // El juego sigue siendo inactivo hasta que el jugador pulse Continuar o Reintentar
        // pero ya puede ver el tablero
        postActions.classList.remove('hidden');
    }

    // ===== CONTROLES =====
    startBtn.addEventListener('click', () => {
        startBtn.classList.add('hidden');
        currentLevel = 1;
        initGame();
    });

    // Botones dentro del win-card
    winContinueBtn.addEventListener('click', () => {
        if (currentLevel < MAX_LEVEL) {
            currentLevel++;
            initGame();
        }
    });

    winRestartBtn.addEventListener('click', () => {
        initGame();
    });

    winCloseBtn.addEventListener('click', closeWinOverlay);

    // Click fuera del win-card cierra el overlay
    winOverlay.addEventListener('click', (e) => {
        if (e.target === winOverlay) closeWinOverlay();
    });

    // Botones inferiores (post-actions) — misma lógica
    continueBtn.addEventListener('click', () => {
        if (currentLevel < MAX_LEVEL) {
            currentLevel++;
            initGame();
        }
    });

    restartBtn.addEventListener('click', () => {
        initGame();
    });

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!winOverlay.classList.contains('hidden')) {
                closeWinOverlay();
            } else if (selectedTower !== null) {
                // Cancelar selección de disco
                selectedTower = null;
                if (showHints) statusText.textContent = 'Selecciona una torre para mover el disco superior';
                else statusText.textContent = '';
                render();
            }
        }
    });
});