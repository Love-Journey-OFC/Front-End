const cards = [...document.querySelectorAll('.step-card')];
const dots = document.querySelector('.carousel-dots');
let currentStep = 0;

function showStep(index) {
  currentStep = (index + cards.length) % cards.length;
  cards.forEach((card, i) => {
    const active = i === currentStep;
    const previous = i === (currentStep + cards.length - 1) % cards.length;
    const next = i === (currentStep + 1) % cards.length;
    card.classList.toggle('active', active);
    card.classList.toggle('previous-card', previous);
    card.classList.toggle('next-card', next);
    card.style.order = previous ? '1' : active ? '2' : next ? '3' : '';
    card.setAttribute('aria-hidden', String(!(active || previous || next)));
  });
  [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === currentStep)));
}

cards.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Mostrar passo ${i + 1}`);
  dot.addEventListener('click', () => showStep(i));
  dots.append(dot);
});
document.querySelector('.prev').addEventListener('click', () => showStep(currentStep - 1));
document.querySelector('.next').addEventListener('click', () => showStep(currentStep + 1));
showStep(currentStep);

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
}));

const quoteTrack = document.querySelector('.quotes');
const quoteDots = [...document.querySelectorAll('.quote-dots i')];
if ('IntersectionObserver' in window && quoteTrack) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = [...quoteTrack.children].indexOf(visible.target);
    quoteDots.forEach((dot, i) => dot.style.background = i === index ? '#fff' : '#ffffff8a');
    document.querySelector('.quote-dots').setAttribute('aria-label', `Depoimento ${index + 1} de 3`);
  }, { root: quoteTrack, threshold: 0.6 });
  quoteTrack.querySelectorAll('.quote').forEach(quote => observer.observe(quote));
}
