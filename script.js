document.addEventListener('DOMContentLoaded', () => {
    // Lógica para botones de acción generales (Efecto de click)
    const actionButtons = document.querySelectorAll('.btn');
    
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        });
    });

    // Lógica para el Filtro de Edad (Age Filter)
    const ageFilters = document.querySelectorAll('.age-filter');
    
    ageFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remover la clase activa de todos los filtros de edad
            ageFilters.forEach(f => f.classList.remove('active-gold'));
            // Añadir la clase activa al clickeado
            filter.classList.add('active-gold');
        });
    });

    // Lógica para el Filtro de Habilidades (Skill Filter)
    const skillFilters = document.querySelectorAll('.skill-filter');
    
    skillFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remover la clase activa de todos los filtros de habilidades
            skillFilters.forEach(f => f.classList.remove('active-gold'));
            // Añadir la clase activa al clickeado
            filter.classList.add('active-gold');
        });
    });
});