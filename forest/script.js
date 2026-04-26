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