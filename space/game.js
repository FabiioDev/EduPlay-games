document.addEventListener('DOMContentLoaded', () => {
    const setupArea = document.getElementById('setup-area');
    const gameBoard = document.getElementById('game-board');
    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('status-text');
    const difficultyBtns = document.querySelectorAll('.difficulty-filter');
    const postLevelActions = document.getElementById('post-level-actions');
    const continueBtn = document.getElementById('continue-btn');
    const restartMenuBtn = document.getElementById('restart-menu-btn');

    // Planet PNGs from resources/planets (excluding back_card.png and galaxy_game.png)
    const planetImages = [
        'earth.png',
        'jupiter.png',
        'jupiter_a.png',
        'jupiter_c.png',
        'mars.png',
        'mars_b.png',
        'mars_c.png',
        'neptune.png',
        'planet.png',
        'planet_a.png',
        'planet_b.png',
        'planet_d.png',
        'saturn.png',
        'saturn_c.png',
        'venus.png'
    ];
    
    let currentDifficulty = 'facil';
    let cardsArray = [];
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let matchedPairs = 0;
    let totalPairs = 0;
    let startTime = 0;

    // --- Motor de Audio Espacial (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playSpaceSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'flip') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } else if (type === 'match') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.linearRampToValueAtTime(1200, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        } else if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.linearRampToValueAtTime(150, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
        }
    }

    // --- Lógica UI ---
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            difficultyBtns.forEach(f => f.classList.remove('active-neon'));
            e.target.classList.add('active-neon');
            currentDifficulty = e.target.dataset.diff;
        });
    });

    // --- Iniciar Juego ---
    function initGame() {
        gameBoard.innerHTML = ''; 
        matchedPairs = 0;
        firstCard = null;
        secondCard = null;
        lockBoard = true; // Lock board during preview
        
        if (currentDifficulty === 'facil') totalPairs = 4;
        else if (currentDifficulty === 'medio') totalPairs = 6;
        else if (currentDifficulty === 'dificil') totalPairs = 8;

        gameBoard.className = `cards-grid ${currentDifficulty}`;

        // Select random planets
        const shuffledPlanets = [...planetImages].sort(() => 0.5 - Math.random());
        const selectedPlanets = shuffledPlanets.slice(0, totalPairs);
        cardsArray = [...selectedPlanets, ...selectedPlanets];
        cardsArray.sort(() => 0.5 - Math.random());

        cardsArray.forEach(planet => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', 'flipped'); // Start flipped (showing front/planet)
            cardElement.dataset.planet = planet;

            cardElement.innerHTML = `
                <div class="card-face card-front">
                    <img src="../resources/planets/${planet}" alt="planet" class="planet-img" />
                </div>
                <div class="card-face card-back">
                    <img src="../resources/planets/back_card.png" alt="card back" class="back-img" />
                </div>
            `;

            cardElement.addEventListener('click', flipCard);
            gameBoard.appendChild(cardElement);
        });

        statusText.textContent = "¡Memoriza los planetas!";
        statusText.style.color = "var(--space-neon-blue)";

        // After 3 seconds, flip all cards face-down and start the game
        setTimeout(() => {
            const allCards = gameBoard.querySelectorAll('.card');
            allCards.forEach(card => {
                card.classList.remove('flipped');
            });
            statusText.textContent = "¡Encuentra los pares!";
            statusText.style.color = "var(--text-light)";
            lockBoard = false;
            startTime = Date.now();
        }, 3000);
    }

    // --- Lógica Voltear ---
    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return; 

        playSpaceSound('flip');
        this.classList.add('flipped');

        if (!firstCard) {
            firstCard = this;
            return;
        }

        secondCard = this;
        checkForMatch();
    }

    // --- Lógica Match ---
    function checkForMatch() {
        let isMatch = firstCard.dataset.planet === secondCard.dataset.planet;

        if (isMatch) {
            playSpaceSound('match');
            disableCards();
        } else {
            playSpaceSound('error');
            unflipCards();
        }
    }

    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        resetBoard();
        matchedPairs++;

        if (matchedPairs === totalPairs) {
            endLevel();
        }
    }

    function unflipCards() {
        lockBoard = true; 
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000); 
    }

    function resetBoard() {
        [firstCard, secondCard, lockBoard] = [null, null, false];
    }

    // --- Dificultad Dinámica ---
    function endLevel() {
        const timeTaken = (Date.now() - startTime) / 1000; 
        statusText.textContent = `¡Misión Completada en ${Math.floor(timeTaken)}s! 🚀`;
        statusText.style.color = "var(--space-neon-blue)";
        
        let targetTime = totalPairs * 4; 
        
        if (timeTaken < targetTime) {
            if (currentDifficulty === 'facil') {
                currentDifficulty = 'medio';
                statusText.textContent += " ¡Subiendo a Medio...";
            } else if (currentDifficulty === 'medio') {
                currentDifficulty = 'dificil';
                statusText.textContent += " ¡Subiendo a Difícil...";
            }
            updateDifficultyUI();
        }

        setTimeout(() => {
            postLevelActions.classList.remove('hidden');
        }, 800);
    }

    function updateDifficultyUI() {
        difficultyBtns.forEach(btn => {
            btn.classList.remove('active-neon');
            if (btn.dataset.diff === currentDifficulty) {
                btn.classList.add('active-neon');
            }
        });
    }

    // --- Listeners de Control ---
    startBtn.addEventListener('click', () => {
        setupArea.classList.add('hidden');
        startBtn.classList.add('hidden');
        gameBoard.classList.remove('hidden');
        initGame();
    });

    continueBtn.addEventListener('click', () => {
        postLevelActions.classList.add('hidden');
        initGame(); 
    });

    restartMenuBtn.addEventListener('click', () => {
        postLevelActions.classList.add('hidden');
        gameBoard.classList.add('hidden');
        setupArea.classList.remove('hidden');
        startBtn.classList.remove('hidden');
        statusText.textContent = "Elige tu nivel para comenzar";
        statusText.style.color = "var(--text-light)";
    });
});