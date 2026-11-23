import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Never shrink figures below half their size; past that, the row is allowed to overflow. */
const MIN_FIT = 0.5;

/**
 * Keeps a row of figures on one line. When the row's content is wider than the row, it lowers
 * the CSS variable --fit (1 = full size) until everything fits. Text that should shrink sizes
 * itself with calc(<size> * var(--fit, 1)); everything else keeps its size.
 *
 * The row must not wrap and its children must not shrink, so overflow shows up in scrollWidth.
 */
@Directive({ selector: '[appFitRow]', standalone: true })
export class FitRowDirective {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const fit = () => this.fit();
      const resize = new ResizeObserver(fit);
      resize.observe(this.host);
      // Amounts change when another month is picked or privacy mode is toggled.
      const mutation = new MutationObserver(fit);
      mutation.observe(this.host, { subtree: true, childList: true, characterData: true });
      fit();
      // Measure again once the display font has loaded; fallback metrics differ.
      void document.fonts?.ready.then(fit);
      destroyRef.onDestroy(() => {
        resize.disconnect();
        mutation.disconnect();
      });
    });
  }

  private fit(): void {
    const row = this.host;
    // Transitions would report the previous size; see [data-fit-measuring] in styles.css.
    row.setAttribute('data-fit-measuring', '');
    try {
      row.style.setProperty('--fit', '1');
      const available = row.clientWidth;
      if (!available || row.scrollWidth <= available) return;

      // Binary search for the largest scale that fits; 8 steps is under 0.5% off.
      let fits = MIN_FIT;
      let tooBig = 1;
      for (let step = 0; step < 8; step++) {
        const scale = (fits + tooBig) / 2;
        row.style.setProperty('--fit', String(scale));
        if (row.scrollWidth <= available) fits = scale;
        else tooBig = scale;
      }
      row.style.setProperty('--fit', String(fits));
      void row.scrollWidth; // apply the final size before transitions come back
    } finally {
      row.removeAttribute('data-fit-measuring');
    }
  }
}
