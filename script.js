document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Lógica para botones de acción generales (Efecto de click) ---
    const actionButtons = document.querySelectorAll('.btn');
    
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Solo prevenimos el default si el botón no es un enlace funcional real (como Empezar a Jugar en info)
            if(btn.getAttribute('href') === '#') {
                e.preventDefault(); 
            }
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        });
    });

    // --- 2. Lógica de Filtrado de Juegos ---
    const ageFilters = document.querySelectorAll('.age-filter');
    const skillFilters = document.querySelectorAll('.skill-filter');
    const cards = document.querySelectorAll('.library-card');

    // Estado inicial
    let currentAgeFilter = 'todas'; // por defecto sin filtro de edad
    let currentSkillFilter = 'todas'; // por defecto "Todas" las habilidades

    // Función principal que oculta o muestra las tarjetas
    function applyFilters() {
        cards.forEach(card => {
            const cardAge = card.getAttribute('data-age');
            const cardSkill = card.getAttribute('data-skill');

            // Si el filtro está en 'todas' o coincide con el dato de la tarjeta (los 'all' son las de próximamente)
            const ageMatches = (currentAgeFilter === 'todas' || cardAge === currentAgeFilter || cardAge === 'all');
            const skillMatches = (currentSkillFilter === 'todas' || cardSkill === currentSkillFilter || cardSkill === 'all');

            if (ageMatches && skillMatches) {
                card.style.display = 'flex'; // Usamos flex porque las tarjetas tienen display flex en el CSS
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Eventos para los botones de Edad
    ageFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Si hace clic en uno que ya está activo, lo desactiva (toggle)
            if (filter.classList.contains('active-gold')) {
                filter.classList.remove('active-gold');
                currentAgeFilter = 'todas';
            } else {
                // Quitar clase activa a todos los de edad y ponérsela al clickeado
                ageFilters.forEach(f => f.classList.remove('active-gold'));
                filter.classList.add('active-gold');
                currentAgeFilter = filter.getAttribute('data-age');
            }
            applyFilters();
        });
    });

    // Eventos para los botones de Habilidades
    skillFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Quitar clase activa a todos los de habilidades
            skillFilters.forEach(f => f.classList.remove('active-gold'));
            // Ponérsela al clickeado
            filter.classList.add('active-gold');
            currentSkillFilter = filter.getAttribute('data-skill');
            
            applyFilters();
        });
    });

    // Ejecutar filtros al cargar por si hay botones activos por defecto en el HTML
    applyFilters();
});