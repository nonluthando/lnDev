(function(){
  const year = document.getElementById("year");
  if(year) year.textContent = new Date().getFullYear();

  const carousel = document.querySelector('[data-carousel="projects"]');
  if(!carousel) return;

  const track = carousel.querySelector(".carousel__track");
  const viewport = carousel.querySelector(".carousel__viewport");
  const btnLeft = carousel.querySelector(".carousel__btn--left");
  const btnRight = carousel.querySelector(".carousel__btn--right");
  const dotsWrap = carousel.querySelector(".carousel__dots");

  const slides = Array.from(track.children);
  let index = 0;
  let timer = null;
  let isInteracting = false;

  slides.forEach((_, i) => {
    const d = document.createElement("button");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.setAttribute("aria-label", "Go to slide " + (i + 1));
    d.addEventListener("click", () => {
      index = i;
      update();
      restart();
    });
    dotsWrap.appendChild(d);
  });

  function slideWidth(){
    return slides[0].getBoundingClientRect().width + 12;
  }

  function update(){
    const x = -index * slideWidth();
    track.style.transform = `translateX(${x}px)`;
    const dots = Array.from(dotsWrap.children);
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function next(){
    index = (index + 1) % slides.length;
    update();
  }

  function prev(){
    index = (index - 1 + slides.length) % slides.length;
    update();
  }

  btnRight.addEventListener("click", () => { next(); restart(); });
  btnLeft.addEventListener("click", () => { prev(); restart(); });

  function start(){
    timer = setInterval(() => {
      if(!isInteracting) next();
    }, 5000);
  }
  function stop(){ if(timer) clearInterval(timer); timer = null; }
  function restart(){ stop(); start(); }

  carousel.addEventListener("mouseenter", () => { isInteracting = true; });
  carousel.addEventListener("mouseleave", () => { isInteracting = false; });

  let startX = 0;
  let dx = 0;
  viewport.addEventListener("touchstart", (e) => {
    isInteracting = true;
    startX = e.touches[0].clientX;
    dx = 0;
  }, {passive:true});

  viewport.addEventListener("touchmove", (e) => {
    dx = e.touches[0].clientX - startX;
  }, {passive:true});

  viewport.addEventListener("touchend", () => {
    if(Math.abs(dx) > 40){
      if(dx < 0) next();
      else prev();
      update();
      restart();
    }
    isInteracting = false;
  });

  window.addEventListener("keydown", (e) => {
    if(e.key === "ArrowRight"){ next(); restart(); }
    if(e.key === "ArrowLeft"){ prev(); restart(); }
  });

  window.addEventListener("resize", update);

  update();
  start();
})();