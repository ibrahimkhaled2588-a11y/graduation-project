(function () {
    'use strict';

    const homeBtn = document.getElementById('homeBtn');
    const formHeader = document.getElementById('Services-Sheader');

    if (homeBtn && formHeader) {
        homeBtn.addEventListener('click', function () {
            formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function initSwiperOnce() {
        const swiperContainer = document.querySelector('.swiper-container');
        if (!swiperContainer) return;
        if (typeof Swiper === 'undefined') return;

        // Prevent double initialization
        if (swiperContainer.dataset.swiperInited === 'true') return;

        swiperContainer.dataset.swiperInited = 'true';

        const width = window.innerWidth || document.documentElement.clientWidth;
        // Target only the current container to avoid initializing other sliders unintentionally
        // Swiper will use the required structure inside prediction_result.html
        new Swiper(swiperContainer, {
            slidesPerView: width < 600 ? 1 : 3,
            spaceBetween: width < 600 ? 10 : 70,
            pagination: { el: '.swiper-pagination', clickable: true },
        });
    }

    // Init immediately and on resize (debounced)
    initSwiperOnce();
    let resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            // Re-init can be required when going from mobile->desktop; clear flag and re-init.
            const swiperContainer = document.querySelector('.swiper-container');
            if (swiperContainer) swiperContainer.dataset.swiperInited = 'false';
            initSwiperOnce();
        }, 200);
    });

    const resultEl = document.getElementById('prediction-result');
    if (resultEl) {
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
})();
