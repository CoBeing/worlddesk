// Compass track is clockwise from north. The SVG nose is explicitly at (12, 2),
// so rendering does not depend on the platform's airplane font/emoji baseline.
export function aircraftIcon(heading) {
 if(!Number.isFinite(heading))return '<span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg></span>'
 const angle=((heading%360)+360)%360
 return `<span><svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${angle}deg)"><path fill="currentColor" d="M12 2C11 2 10.5 3.2 10.5 5V9L3 14V16L10.5 13.5V18L8 20V22L12 20.5L16 22V20L13.5 18V13.5L21 16V14L13.5 9V5C13.5 3.2 13 2 12 2Z"/></svg></span>`
}
