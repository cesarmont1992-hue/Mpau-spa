document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".banner-slider .slide"));
  const previousButton = document.querySelector(".banner-prev");
  const nextButton = document.querySelector(".banner-next");
  const dots = Array.from(document.querySelectorAll(".banner-dots .dot"));
  const banner = document.querySelector(".banner");

  // Si no se encuentra el banner, no se ejecuta el carrusel.
  if (slides.length === 0 || !banner) return;

  let currentSlide = 0;
  let automaticChange;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, position) => {
      slide.classList.toggle("active", position === currentSlide);
    });

    dots.forEach((dot, position) => {
      dot.classList.toggle("active", position === currentSlide);
      dot.setAttribute("aria-current", position === currentSlide ? "true" : "false");
    });
  }

  function startAutomaticChange() {
    clearInterval(automaticChange);
    automaticChange = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
  }

  function changeManually(direction) {
    showSlide(currentSlide + direction);
    startAutomaticChange();
  }

  previousButton?.addEventListener("click", () => changeManually(-1));
  nextButton?.addEventListener("click", () => changeManually(1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startAutomaticChange();
    });
  });

  // Pausa el cambio automático mientras el cursor está sobre el banner.
  banner.addEventListener("mouseenter", () => clearInterval(automaticChange));
  banner.addEventListener("mouseleave", startAutomaticChange);

  showSlide(0);
  startAutomaticChange();
});
