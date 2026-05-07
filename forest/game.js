document.addEventListener('DOMContentLoaded', () => {
  const pads = document.querySelectorAll('.animal-pad');
  const startBtn = document.getElementById('start-btn');
  const statusText = document.getElementById('status-text');
  const difficultyBtns = document.querySelectorAll('.difficulty-filter');
  
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

  // --- 4. Ajuste Dinámico de Dificultad (DDA) ---
  function evaluatePerformance() {
    const totalTimeTaken = Date.now() - turnStartTime;
    const targetTime = gameSequence.length * 1500;

    if (currentDifficulty !== 'facil') {
      if (totalTimeTaken < targetTime * 0.7) { 
        config.playbackSpeed = Math.max(200, config.playbackSpeed * 0.9);
        config.pauseSpeed = Math.max(100, config.pauseSpeed * 0.9);
      } 
      else if (totalTimeTaken > targetTime * 1.2) { 
        config.playbackSpeed = Math.min(600, config.playbackSpeed * 1.1);
        config.pauseSpeed = Math.min(300, config.pauseSpeed * 1.1);
      }
    }
  }

  // --- 5. Interacciones del Jugador ---
  function handlePlayerTouch(e) {
    e.preventDefault();
    
    if (!isPlayerTurn) return;
    if (playerSequence.length >= gameSequence.length) return;

    const padIndex = parseInt(e.currentTarget.dataset.id);
    playerSequence.push(padIndex);
    animatePad(padIndex);

    const currentMoveIndex = playerSequence.length - 1;
    
    // ¿Se equivocó?
    if (playerSequence[currentMoveIndex] !== gameSequence[currentMoveIndex]) {
      statusText.textContent = "¡Uy! Patrón incorrecto 🌟";
      statusText.style.color = "var(--accent-red)";
      isPlayerTurn = false;
      
      // Solo mostramos los botones SI PIERDE
      postLevelActions.classList.remove('hidden');
      continueBtn.classList.remove('hidden');
      continueBtn.textContent = "Reintentar Ronda"; // Cambiamos texto
      return;
    }

    // ¿Completó la secuencia correcta?
    if (playerSequence.length === gameSequence.length) {
      isPlayerTurn = false;
      statusText.textContent = "¡Súper bien! 🎉";
      statusText.style.color = "var(--accent-green-dark)";
      
      evaluatePerformance(); 
      
      // EL CAMBIO MAGISTRAL: Esperamos 1 segundo para que vea el mensaje y lanzamos la siguiente ronda solos
      setTimeout(() => {
        nextRound();
      }, 1000);
    }
  }

  // --- Listeners de UI ---
  pads.forEach(pad => {
    pad.addEventListener('pointerdown', handlePlayerTouch);
  });

  startBtn.addEventListener('click', () => {
    setupArea.classList.add('hidden');
    startBtn.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    
    randomizeBoard();
    setupDifficultyConfig();
    nextRound();
  });

  // Botón de Reintentar (Si se equivocó)
  continueBtn.addEventListener('click', () => {
    postLevelActions.classList.add('hidden');
    playerSequence = []; // Reseteamos sus toques
    // Repetimos la secuencia de la máquina sin agregarle una nota nueva
    setTimeout(playMachineSequence, 500);
  });

  // Botón de Cambiar Nivel (Reset total)
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