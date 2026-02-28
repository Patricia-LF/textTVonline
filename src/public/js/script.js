function toggleMenu() {
        const menu = document.querySelector('.mobile-menu');
        const hamburger = document.querySelector('.hamburger');
        const body = document.body;

        menu.classList.toggle('active');
        hamburger.classList.toggle('active');

        // Förhindra scrollning när menyn är öppen
        if (menu.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }