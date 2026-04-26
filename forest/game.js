// Referencias al DOM
const pads = document.querySelectorAll('.animal-pad');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');

// Estado del Juego
let gameSequence = [];
let playerSequence = [];
let isPlayerTurn = false;

// Configuración del Web Audio API (Sonidos generados nativamente)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Diferentes frecuencias musicales para cada animal (Acorde alegre)
const frequencies = [329.63, 261.63, 220.00, 392.00]; // Mi, Do, La, Sol

/**
 * Sintetizador de audio integrado. 
 * Crea un tono suave ("sine") que no sobreestimula.
 */
function playSound(index) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = 'sine'; // Onda suave
  oscillator.frequency.value = frequencies[index];
  
  // Envolvente de sonido táctil (inicia fuerte, decae rápido)
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.4);
}

/**
 * Anima un "animal" y reproduce su sonido.
 * Retorna una Promesa para poder usar async/await en la secuencia.
 */
function animatePad(index) {
  return new Promise(resolve => {
    const pad = pads[index];
    pad.classList.add('active');
    playSound(index);
    
    // El tiempo que se mantiene "inflado" el botón
    setTimeout(() => {
      pad.classList.remove('active');
      // Pausa entre animaciones
      setTimeout(resolve, 300);
    }, 500); 
  });
}

/**
 * Reproduce la secuencia completa generada por la máquina.
 */
async function playMachineSequence() {
  isPlayerTurn = false;
  statusText.textContent = "¡Escucha y observa!";
  
  // Usamos async/await para iterar fluidamente la secuencia visual
  for (let i = 0; i < gameSequence.length; i++) {
    await animatePad(gameSequence[i]);
  }
  
  isPlayerTurn = true;
  statusText.textContent = "¡Es tu turno!";
}

/**
 * Genera un nuevo paso en el juego y dispara la ronda.
 */
function nextRound() {
  playerSequence = [];
  // Escoge un animal aleatorio (0 al 3) y lo añade a la secuencia
  const randomPad = Math.floor(Math.random() * 4);
  gameSequence.push(randomPad);
  
  // Un segundo de respiro antes de empezar a mostrar
  setTimeout(playMachineSequence, 1000);
}

/**
 * Manejador del toque del jugador en un animal.
 */
function handlePlayerTouch(e) {
  if (!isPlayerTurn) return; // Si la máquina está jugando, ignora el toque

  const padIndex = parseInt(e.target.dataset.id);
  playerSequence.push(padIndex);
  
  // Feedback inmediato al tocar
  animatePad(padIndex);

  // Verificación de la jugada actual
  const currentMoveIndex = playerSequence.length - 1;
  
  if (playerSequence[currentMoveIndex] !== gameSequence[currentMoveIndex]) {
    // Equivocación (Game Over amigable)
    statusText.textContent = "¡Uy! Inténtalo de nuevo 🌟";
    statusText.style.color = "var(--primary)";
    isPlayerTurn = false;
    startBtn.style.display = 'inline-block';
    startBtn.textContent = 'Volver a Jugar';
    return;
  }

  // Si el jugador completó toda la secuencia correctamente
  if (playerSequence.length === gameSequence.length) {
    isPlayerTurn = false;
    statusText.textContent = "¡Súper bien! 🎉";
    statusText.style.color = "#006942"; // Verde de éxito (Secondary EduPlay)
    
    setTimeout(() => {
      statusText.style.color = "var(--on-surface)"; // Reset color
      nextRound();
    }, 1500); // 1.5s de celebración
  }
}

// ---- Event Listeners ---- //

// Usamos pointerdown en lugar de click para mejor respuesta táctil
pads.forEach(pad => {
  pad.addEventListener('pointerdown', handlePlayerTouch);
});

startBtn.addEventListener('click', () => {
  startBtn.style.display = 'none';
  statusText.style.color = "var(--on-surface)";
  gameSequence = []; // Reseteamos la memoria del juego
  nextRound();
});

document.addEventListener('DOMContentLoaded', () => {
  const pads = document.querySelectorAll('.animal-pad');
  const startBtn = document.getElementById('start-btn');
  const statusText = document.getElementById('status-text');
  const difficultyBtns = document.querySelectorAll('.difficulty-filter');
  const gameSetup = document.querySelector('.game-setup');

  // Banco extenso de emojis para rotar en cada partida
  const animalPool = ['🦊','🐸','🐦','🦉','🐱','🐶','🐰','🐻','🐼','🐨','🦁','🐮','🐷','🐙','🐵','🦋'];
  
  let gameSequence = [];
  let playerSequence = [];
  let isPlayerTurn = false;
  let currentDifficulty = 'facil';
  
  // Variables para medir la velocidad de reacción
  let turnStartTime = 0;
  
  // Parámetros dinámicos que cambiarán según la dificultad y habilidad
  let config = {
    playbackSpeed: 600, // Tiempo que brilla un botón (ms)
    pauseSpeed: 300     // Pausa entre botones (ms)
  };

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const baseFrequencies = [329.63, 261.63, 220.00, 392.00];

  // --- 1. Lógica de UI y Configuración Inicial ---

  // Selector de dificultad
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      difficultyBtns.forEach(f => f.classList.remove('active-gold'));
      e.target.classList.add('active-gold');
      currentDifficulty = e.target.dataset.diff;
    });
  });

  // Aleatorizar los emojis en el tablero
  function randomizeBoard() {
    // Ordena aleatoriamente el array y toma los primeros 4
    const shuffled = animalPool.sort(() => 0.5 - Math.random()).slice(0, 4);
    pads.forEach((pad, index) => {
      pad.textContent = shuffled[index];
    });
  }

  // Configurar parámetros base según la dificultad seleccionada
  function setupDifficultyConfig() {
    if (currentDifficulty === 'facil') {
      config.playbackSpeed = 600;
      config.pauseSpeed = 300;
      gameSequence = []; // Empieza con 1 al llamar nextRound()
    } else if (currentDifficulty === 'medio') {
      config.playbackSpeed = 400; // Más rápido
      config.pauseSpeed = 200;
      gameSequence = []; 
    } else if (currentDifficulty === 'dificil') {
      config.playbackSpeed = 350;
      config.pauseSpeed = 150;
      // Empieza con una secuencia de 2 pasos pre-cargados
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
    
    // El sonido dura proporcionalmente a la velocidad del juego
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

  // --- 3. Flujo del Juego (Game Loop) ---

  async function playMachineSequence() {
    isPlayerTurn = false;
    statusText.textContent = "¡Escucha y observa!";
    
    for (let i = 0; i < gameSequence.length; i++) {
      await animatePad(gameSequence[i]);
    }
    
    isPlayerTurn = true;
    statusText.textContent = "¡Es tu turno!";
    turnStartTime = Date.now(); // Iniciar cronómetro de reacción
  }

  function nextRound() {
    playerSequence = [];
    const randomPad = Math.floor(Math.random() * 4);
    gameSequence.push(randomPad);
    
    setTimeout(playMachineSequence, 1000);
  }

  // --- 4. Ajuste Dinámico de Dificultad (DDA) ---

  function evaluatePerformance() {
    const timeTaken = Date.now() - turnStartTime;
    // Tiempo promedio por cada click que hizo el jugador
    const avgTimePerClick = timeTaken / gameSequence.length;

    // Solo ajustamos dinámicamente en niveles medio y dificil
    if (currentDifficulty !== 'facil') {
      // Si el niño responde en menos de 800ms en promedio (Muy rápido)
      if (avgTimePerClick < 800) {
        // Aumentamos la velocidad de la máquina un 10%, sin bajar de límites absurdos
        config.playbackSpeed = Math.max(200, config.playbackSpeed * 0.9);
        config.pauseSpeed = Math.max(100, config.pauseSpeed * 0.9);
      } 
      // Si tarda más de 2000ms (Le cuesta un poco), ralentizamos para ayudarle
      else if (avgTimePerClick > 2000) {
        config.playbackSpeed = Math.min(600, config.playbackSpeed * 1.1);
        config.pauseSpeed = Math.min(300, config.pauseSpeed * 1.1);
      }
    }
  }

  function handlePlayerTouch(e) {
    if (!isPlayerTurn) return;

    const padIndex = parseInt(e.target.dataset.id);
    playerSequence.push(padIndex);
    animatePad(padIndex);

    const currentMoveIndex = playerSequence.length - 1;
    
    // ¿Se equivocó?
    if (playerSequence[currentMoveIndex] !== gameSequence[currentMoveIndex]) {
      statusText.textContent = "¡Uy! Inténtalo de nuevo 🌟";
      isPlayerTurn = false;
      startBtn.style.display = 'inline-block';
      gameSetup.style.display = 'flex'; // Volver a mostrar selector
      startBtn.textContent = 'Volver a Jugar';
      return;
    }

    // ¿Completó la secuencia correcta?
    if (playerSequence.length === gameSequence.length) {
      isPlayerTurn = false;
      statusText.textContent = "¡Súper bien! 🎉";
      
      evaluatePerformance(); // Calcular si subimos o bajamos la velocidad
      
      setTimeout(() => {
        nextRound();
      }, 1000);
    }
  }

  // --- Listeners ---
  pads.forEach(pad => {
    pad.addEventListener('pointerdown', handlePlayerTouch);
  });

  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    gameSetup.style.display = 'none'; // Ocultar filtros al jugar
    
    randomizeBoard();
    setupDifficultyConfig();
    nextRound();
  });
});