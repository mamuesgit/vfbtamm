// Kinder eines Elements bei jedem Seitenaufruf in zufällige Reihenfolge bringen (Fisher-Yates).
// Für die Sponsoren: Die Seite ist statisch, deshalb wird im Browser gemischt – sonst stünde
// bis zum nächsten Build immer derselbe Sponsor vorn.
export function mischen(el: Element) {
  const kinder = [...el.children];
  for (let i = kinder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinder[i], kinder[j]] = [kinder[j], kinder[i]];
  }
  el.append(...kinder);
}
