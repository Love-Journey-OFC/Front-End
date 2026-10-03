const stepCards = [...document.querySelectorAll(".step-card")];
const stepTrack = document.querySelector(".step-track");
const stepDots = document.querySelector(".carousel-dots");
const previousStep = document.querySelector(".carousel-arrow.prev");
const nextStep = document.querySelector(".carousel-arrow.next");
let currentStep = 0;

function showStep(index) {
  if (!stepCards.length) return;

  currentStep = (index + stepCards.length) % stepCards.length;

  stepCards.forEach((card, cardIndex) => {
    const active = cardIndex === currentStep;
    const previous = cardIndex === (currentStep + stepCards.length - 1) % stepCards.length;
    const next = cardIndex === (currentStep + 1) % stepCards.length;

    card.classList.toggle("active", active);
    card.classList.toggle("previous-card", previous);
    card.classList.toggle("next-card", next);
    card.style.order = previous ? "1" : active ? "2" : next ? "3" : "";
    card.setAttribute("aria-hidden", String(!(active || previous || next)));
  });

  [...(stepDots?.children ?? [])].forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", String(dotIndex === currentStep));
  });
}

if (stepDots && stepCards.length) {
  stepCards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar passo ${index + 1}`);
    dot.addEventListener("click", () => showStep(index));
    stepDots.append(dot);
  });

  previousStep?.addEventListener("click", () => showStep(currentStep - 1));
  nextStep?.addEventListener("click", () => showStep(currentStep + 1));
  stepTrack?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showStep(currentStep - 1);
    if (event.key === "ArrowRight") showStep(currentStep + 1);
  });

  let touchStartX = null;
  stepTrack?.addEventListener("pointerdown", (event) => {
    touchStartX = event.pointerType === "touch" ? event.clientX : null;
  });
  stepTrack?.addEventListener("pointerup", (event) => {
    if (touchStartX === null) return;
    const distance = event.clientX - touchStartX;
    if (Math.abs(distance) > 45) showStep(currentStep + (distance < 0 ? 1 : -1));
    touchStartX = null;
  });

  showStep(currentStep);
}

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

function setMenuOpen(open) {
  if (!menuToggle || !mainNav) return;
  mainNav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

document.addEventListener("click", (event) => {
  if (
    mainNav?.classList.contains("open") &&
    !mainNav.contains(event.target) &&
    !menuToggle?.contains(event.target)
  ) {
    setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setMenuOpen(false);
});

const planTrack = document.querySelector(".plans");
const planCards = [...document.querySelectorAll(".plan")];
const defaultPlan = Math.max(0, planCards.findIndex((card) => card.classList.contains("plan-highlight")));

function highlightPlan(index) {
  planCards.forEach((card, cardIndex) => {
    card.classList.toggle("plan-highlight", cardIndex === index);
  });
}

planCards.forEach((card, index) => {
  card.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") highlightPlan(index);
  });
  card.addEventListener("focusin", () => highlightPlan(index));
});

planTrack?.addEventListener("pointerleave", () => highlightPlan(defaultPlan));
planTrack?.addEventListener("focusout", (event) => {
  if (!planTrack.contains(event.relatedTarget)) highlightPlan(defaultPlan);
});

const quoteTrack = document.querySelector(".quotes");
const quotes = [...document.querySelectorAll(".quote")];
const quoteDots = [...document.querySelectorAll(".quote-dots button")];
const mobileQuotes = window.matchMedia("(max-width: 760px)");

function selectQuote(index, scroll = false) {
  if (!quotes.length) return;

  const selectedIndex = (index + quotes.length) % quotes.length;
  quotes.forEach((quote, quoteIndex) => {
    quote.classList.toggle("is-active", quoteIndex === selectedIndex);
  });
  quoteDots.forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", String(dotIndex === selectedIndex));
  });

  if (scroll && mobileQuotes.matches && quoteTrack) {
    const quote = quotes[selectedIndex];
    const left = quote.offsetLeft - (quoteTrack.clientWidth - quote.clientWidth) / 2;
    quoteTrack.scrollTo({ left, behavior: "smooth" });
  }
}

quoteDots.forEach((dot, index) => {
  dot.addEventListener("click", () => selectQuote(index, true));
});

let quoteObserver;

function observeMobileQuotes() {
  quoteObserver?.disconnect();
  quoteObserver = null;

  if (!mobileQuotes.matches || !quoteTrack || !("IntersectionObserver" in window)) {
    if (!mobileQuotes.matches) selectQuote(1);
    return;
  }

  quoteObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!mostVisible) return;
      selectQuote(quotes.indexOf(mostVisible.target));
    },
    { root: quoteTrack, threshold: [0.35, 0.55, 0.75, 0.9] },
  );

  quotes.forEach((quote) => quoteObserver.observe(quote));
  selectQuote(0);
}

mobileQuotes.addEventListener("change", observeMobileQuotes);
observeMobileQuotes();
