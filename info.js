document.addEventListener('DOMContentLoaded', () => {
    // 1. Base de datos local de juegos
    const gamesDB = {
        "bosque": {
            title: "El Bosque de los Sonidos",
            icon: "music_note",
            iconColor: "text-blue",
            age: "4-6 años",
            skillCategory: "Memorización",
            description: "Un juego interactivo donde entrenarás tu memoria a corto plazo...",
            rules: "En la pantalla aparecerán varios animales...",
            skills: ["Memoria de trabajo auditiva", "Memoria visual a corto plazo", "Concentración", "Secuenciación"],
            playUrl: "forest/index.html",
            // --- NUEVOS CAMPOS ---
            imgSrc: "resources/forest.png",
            themeClass: "theme-forest",
            imgClass: "game-img" 
        },
        "espacio": {
            title: "Parejas en el Espacio",
            icon: "cognition",
            iconColor: "text-green",
            age: "4-6 años",
            skillCategory: "Atención",
            description: "Una aventura intergaláctica...",
            rules: "Encuentra los pares de planetas iguales...",
            skills: ["Memoria de trabajo visuoespacial", "Concentración sostenida", "Atención al detalle"],
            playUrl: "space/index.html",
            // --- NUEVOS CAMPOS ---
            imgSrc: "resources/planets/galaxy_game.png",
            themeClass: "theme-space",
            imgClass: "game-img"
        },
        "hanoi": {
            title: "La Torre de Hanoi",
            icon: "route",
            iconColor: "text-yellow",
            age: "7-10 años",
            skillCategory: "Lógica",
            description: "Un rompecabezas matemático clásico...",
            rules: "Debes mover una serie de discos entre diferentes torres...",
            skills: ["Resolución de problemas", "Planificación anticipada", "Razonamiento lógico", "Funciones ejecutivas"],
            playUrl: "hanoi/index.html",
            // --- NUEVOS CAMPOS ---
            imgSrc: "resources/hanoi.png",
            themeClass: "theme-hanoi",
            imgClass: "game-img-cover" // Este es diferente para que cubra todo
        }
    };

    // 2. Extraer el ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    // 3. Obtener elementos del DOM
    const titleEl = document.getElementById('game-title');
    const iconEl = document.getElementById('game-icon');
    const iconContainerEl = document.getElementById('game-icon-container');
    const badgesEl = document.getElementById('game-badges');
    const descEl = document.getElementById('game-desc');
    const rulesEl = document.getElementById('game-rules');
    const skillsEl = document.getElementById('game-skills');
    const playBtn = document.getElementById('play-btn');

    // 4. Inyectar datos o mostrar error
    const game = gamesDB[gameId];

    if (game) {
        titleEl.textContent = game.title;
        iconEl.textContent = game.icon;
        
        iconContainerEl.className = `icon-circle icon-large ${game.iconColor}`;

        const previewContainer = document.querySelector('.game-preview-area');
        const previewImg = document.getElementById('game-preview-img');

        previewImg.src = game.imgSrc;

        previewContainer.className = `game-preview-area ${game.themeClass}`;
        previewImg.className = game.imgClass;

        badgesEl.innerHTML = `
            <span class="badge logic-badge" style="margin-bottom:0;">${game.age}</span>
            <span class="badge timer-badge" style="margin-bottom:0;">${game.skillCategory}</span>
        `;

        descEl.textContent = game.description;
        rulesEl.textContent = game.rules;
        
        skillsEl.innerHTML = '';
        game.skills.forEach(skill => {
            const li = document.createElement('li');
            li.textContent = skill;
            skillsEl.appendChild(li);
        });

        playBtn.href = game.playUrl;

        // Limpiar eventos anteriores para evitar que se dupliquen
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

        // Efecto del botón y bloqueo si no está listo
        newPlayBtn.addEventListener('click', (e) => {
            if(game.playUrl === "#") {
                e.preventDefault();
                alert("¡Este juego aún está en desarrollo!");
            }
        });

    } else {
        titleEl.textContent = "Juego no encontrado";
        descEl.textContent = "No pudimos cargar la información de este minijuego. Por favor, regresa a la biblioteca.";
        rulesEl.textContent = "-";
        playBtn.style.display = "none";
    }
});