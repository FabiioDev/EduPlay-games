document.addEventListener('DOMContentLoaded', () => {
  const pads = document.querySelectorAll('.animal-pad');
  const startBtn = document.getElementById('start-btn');
  const statusText = document.getElementById('status-text');
  const difficultyBtns = document.querySelectorAll('.difficulty-filter');
  
  // Nuevos contenedores de UI
  const setupArea = document.getElementById('setup-area');
  const gameBoard = document.getElementById('game-board');
  const postLevelActions = document.getElementById('post-level-actions');
  const continueBtn = document.getElementById('continue-btn');
  const restartMenuBtn = document.getElementById('restart-menu-btn');

  const animalPool = ['🦊','🐸','🐦','🦉','🐱','🐶','🐰','🐻','🐼','🐨','🦁','🐮','🐷','🐙','🐵','🦋'];
  
  let gameSequence = [];
  let playerSequence = [];
  let isPlayerTurn = false;
  let currentDifficulty = 'facil';
  let turnStartTime = 0;
  
  let config = {
    playbackSpeed: 600, 
    pauseSpeed: 300     
  };

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const baseFrequencies = [329.63, 261.63, 220.00, 392.00];

  // --- 1. Lógica de UI ---
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      difficultyBtns.forEach(f => f.classList.remove('active-gold'));
      e.target.classList.add('active-gold');
      currentDifficulty = e.target.dataset.diff;
    });
  });

  function randomizeBoard() {
    const shuffled = animalPool.sort(() => 0.5 - Math.random()).slice(0, 4);
    pads.forEach((pad, index) => {
      pad.textContent = shuffled[index];
    });
  }

  function setupDifficultyConfig() {
    if (currentDifficulty === 'facil') {
      config.playbackSpeed = 600; config.pauseSpeed = 300; gameSequence = [];
    } else if (currentDifficulty === 'medio') {
      config.playbackSpeed = 400; config.pauseSpeed = 200; gameSequence = []; 
    } else if (currentDifficulty === 'dificil') {
      config.playbackSpeed = 350; config.pauseSpeed = 150;
      gameSequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    }
  }

  // --- 2. Lógica de Audio y Animación ---
  function playSound(index) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = baseFrequencies[index];
    const soundDuration = config.playbackSpeed / 1000; 
    
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + soundDuration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + soundDuration);
  }

  function animatePad(index) {
    return new Promise(resolve => {
      const pad = pads[index];
      pad.classList.add('active');
      playSound(index);
      
      setTimeout(() => {
        pad.classList.remove('active');
        setTimeout(resolve, config.pauseSpeed);
      }, config.playbackSpeed); 
    });
  }

  // --- 3. Flujo del Juego ---
  async function playMachineSequence() {
    isPlayerTurn = false;
    statusText.textContent = "¡Escucha y observa!";
    statusText.style.color = "var(--text-main)";
    
    for (let i = 0; i < gameSequence.length; i++) {
      await animatePad(gameSequence[i]);
    }
    
    isPlayerTurn = true;
    statusText.textContent = "¡Es tu turno!";
    turnStartTime = Date.now(); 
  }

  function nextRound() {
    playerSequence = [];
    gameSequence.push(Math.floor(Math.random() * 4));
    setTimeout(playMachineSequence, 800);
  }

  // --- 4. Ajuste Dinámico de Dificultad (DDA) basado en Tiempo Total ---
  function evaluatePerformance() {
    const totalTimeTaken = Date.now() - turnStartTime;
    // Calculamos un tiempo "objetivo" ideal basado en cuántas piezas tiene el patrón actual
    // Ej: Para 3 piezas, esperamos que el niño tarde unos 4500ms (1.5 seg por pieza)
    const targetTime = gameSequence.length * 1500;

    if (currentDifficulty !== 'facil') {
      if (totalTimeTaken < targetTime * 0.7) { 
        // ¡Lo hizo muy rápido en total!
        config.playbackSpeed = Math.max(200, config.playbackSpeed * 0.9);
        config.pauseSpeed = Math.max(100, config.pauseSpeed * 0.9);
      } 
      else if (totalTimeTaken > targetTime * 1.2) { 
        // Tardó bastante en completar toda la secuencia
        config.playbackSpeed = Math.min(600, config.playbackSpeed * 1.1);
        config.pauseSpeed = Math.min(300, config.pauseSpeed * 1.1);
      }
    }
  }

  // --- 5. Interacciones del Jugador ---
  function handlePlayerTouch(e) {
    // PREVENCIÓN DE BUGS: preventDefault evita los ghost clicks en móviles.
    e.preventDefault();
    
    // Bloqueos de seguridad: Evita toques extra simultáneos
    if (!isPlayerTurn) return;
    if (playerSequence.length >= gameSequence.length) return;

    const padIndex = parseInt(e.currentTarget.dataset.id); // currentTarget es más seguro
    playerSequence.push(padIndex);
    animatePad(padIndex);

    const currentMoveIndex = playerSequence.length - 1;
    
    // ¿Se equivocó?
    if (playerSequence[currentMoveIndex] !== gameSequence[currentMoveIndex]) {
      statusText.textContent = "¡Uy! Patrón incorrecto 🌟";
      statusText.style.color = "var(--accent-red)";
      isPlayerTurn = false;
      postLevelActions.classList.remove('hidden');
      continueBtn.classList.add('hidden'); // Ocultar continuar si perdió
      return;
    }

    // ¿Completó la secuencia correcta?
    if (playerSequence.length === gameSequence.length) {
      isPlayerTurn = false;
      statusText.textContent = "¡Súper bien! 🎉";
      statusText.style.color = "var(--accent-green-dark)";
      
      evaluatePerformance(); 
      
      // En lugar de avanzar automáticamente, mostramos el menú de Continuar
      setTimeout(() => {
        postLevelActions.classList.remove('hidden');
        continueBtn.classList.remove('hidden'); // Asegurar que esté visible al ganar
      }, 500);
    }
  }

  // --- Listeners de UI ---
  pads.forEach(pad => {
    // pointerdown unifica ratón y táctil, se recomienda sobre click para juegos
    pad.addEventListener('pointerdown', handlePlayerTouch);
  });

  // Botón Principal de Iniciar Juego
  startBtn.addEventListener('click', () => {
    setupArea.classList.add('hidden');
    startBtn.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    
    randomizeBoard();
    setupDifficultyConfig();
    nextRound();
  });

  // Botón de Continuar (Siguiente Nivel)
  continueBtn.addEventListener('click', () => {
    postLevelActions.classList.add('hidden');
    nextRound();
  });

  // Botón de Cambiar Nivel (Reset y Regresar a Setup)
  restartMenuBtn.addEventListener('click', () => {
    postLevelActions.classList.add('hidden');
    gameBoard.classList.add('hidden');
    setupArea.classList.remove('hidden');
    startBtn.classList.remove('hidden');
    
    statusText.textContent = "Elige tu nivel para comenzar";
    statusText.style.color = "var(--text-main)";
    gameSequence = [];
  });

});


//TODO: progresión de dificultad check-listo, bajada de dificultad not working
// mejorar feedback visual tanto de errores como de aciertos, y feedback de animación cuando se toca el pad de cada animal
// por ejemplo tenga más sombreado el pad activo