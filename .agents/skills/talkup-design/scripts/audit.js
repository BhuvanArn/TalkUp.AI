// TalkUp design audit — browser-side. Inject into a page (Playwright `page.addScriptTag({ path })`,
// or paste into DevTools), then call `window.__talkupAudit({ root: 'main' })`.
// Returns { theme, findings[] }; each finding reads like a designer's note:
// "Gap between #email and #password is 24px; norm 16–20px."
// Norms: see ../references/craft-rules.md. Keep both in sync.
(() => {
  const NORMS = {
    labelInput: [4, 8], // px, label bottom → control top
    labelInputWarn: [2, 12],
    fieldGap: [16, 20], // px between consecutive fields (designer: "soit 16 ou 20")
    buttonGapTypical: [24, 32], // last field → submit (seminar: 32)
    proximityRatio: 1.5, // field gap / label gap
    textContrast: 4.5,
    largeTextContrast: 3,
    nonTextContrast: 3,
    target: 24, // WCAG 2.5.8 minimum
    maxFontSizes: 8,
    lineLength: [45, 75],
    lineLengthWarn: 90,
    bodyLineHeight: [1.3, 1.8],
    grid: 4,
    transitionMax: 500, // ms
  };

  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  ctx.canvas.width = ctx.canvas.height = 1;

  const toRGBA = (css) => {
    if (!css || css === 'transparent') return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const blend = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const fmtRatio = (r) => `${(Math.floor(r * 10) / 10).toFixed(1)}:1`;
  const px = (v) => parseFloat(v) || 0;
  const round = (v) => Math.round(v);

  // Dev-only overlays never ship: skip them. Callers add their own with { ignore: [...] }.
  const DEFAULT_IGNORE = ['.TanStackRouterDevtools', '.tsqd-parent-container', '[data-talkup-audit-ignore]'];
  let ignoreSel = DEFAULT_IGNORE.join(',');

  const isVisible = (el) => {
    if (el.closest('[aria-hidden="true"]') || el.closest(ignoreSel)) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    }
    return true;
  };

  const sel = (el) => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && parts.length < 4; e = e.parentElement) {
      if (e.id) {
        parts.unshift(`#${CSS.escape(e.id)}`);
        break;
      }
      const tid = e.getAttribute('data-testid');
      if (tid) {
        parts.unshift(`[data-testid="${tid}"]`);
        break;
      }
      const tag = e.tagName.toLowerCase();
      if (tag === 'body') break;
      const idx = e.parentElement ? [...e.parentElement.children].indexOf(e) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  };

  const effectiveBg = (el) => {
    const layers = [];
    let hasImage = false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') hasImage = true;
      const c = toRGBA(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let bg = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return { rgb: bg, hasImage };
  };

  const labelFor = (control) => {
    if (control.id) {
      const l = document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
      if (l) return l;
    }
    const wrap = control.closest('label');
    if (wrap) return wrap;
    const by = control.getAttribute('aria-labelledby');
    return by ? document.getElementById(by.split(' ')[0]) : null;
  };

  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('')
      .trim();

  function auditForms(root, add) {
    const containers = root.querySelectorAll('form').length ? [...root.querySelectorAll('form')] : [root];
    for (const form of containers) {
      const controls = [...form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(isVisible);
      const fields = controls.map((c) => {
        const label = labelFor(c);
        const cr = c.getBoundingClientRect();
        const separate = label && !label.contains(c) && isVisible(label);
        const lr = separate ? label.getBoundingClientRect() : null;
        return { el: c, labelGap: lr ? cr.top - lr.bottom : null, top: lr ? Math.min(lr.top, cr.top) : cr.top, bottom: cr.bottom };
      });
      fields.forEach((f) => {
        const visibleLabel = labelFor(f.el); if (!(visibleLabel && visibleLabel !== f.el && isVisible(visibleLabel) && visibleLabel.textContent.trim()) && f.el.placeholder)
          add('form.placeholder-label', 'WARN', f.el, 'placeholder only', 'visible label above the field', `Field ${sel(f.el)} uses its placeholder "${f.el.placeholder}" as label: it disappears on typing. Put a visible label above and an example in the placeholder.`);
        if (f.labelGap === null) return;
        const g = round(f.labelGap);
        if (g < NORMS.labelInputWarn[0] || g > NORMS.labelInputWarn[1])
          add('form.label-input-gap', 'WARN', f.el, `${g}px`, `${NORMS.labelInput[0]}–${NORMS.labelInput[1]}px`, `Label to field ${sel(f.el)} is ${g}px; norm ${NORMS.labelInput[0]}–${NORMS.labelInput[1]}px.`);
      });
      const gaps = [];
      for (let i = 1; i < fields.length; i++) {
        const g = round(fields[i].top - fields[i - 1].bottom);
        if (g < 0) continue; // side by side
        gaps.push(g);
        if (g < NORMS.fieldGap[0] || g > NORMS.fieldGap[1])
          add('form.field-gap', 'WARN', fields[i].el, `${g}px`, `${NORMS.fieldGap[0]}–${NORMS.fieldGap[1]}px`, `Gap between ${sel(fields[i - 1].el)} and ${sel(fields[i].el)} is ${g}px; norm ${NORMS.fieldGap[0]}–${NORMS.fieldGap[1]}px.`);
      }
      const labelGaps = fields.map((f) => f.labelGap).filter((v) => v !== null);
      if (gaps.length && labelGaps.length) {
        const minGap = Math.min(...gaps);
        const maxLabel = Math.max(...labelGaps, 1);
        if (minGap / maxLabel < NORMS.proximityRatio)
          add('spacing.proximity-ratio', 'WARN', form, `${minGap}px / ${round(maxLabel)}px`, `≥ ${NORMS.proximityRatio}×`, `Fields are ${minGap}px apart but labels sit ${round(maxLabel)}px from their field: groups do not read as groups (ratio under ${NORMS.proximityRatio}).`);
      }
      const last = fields.at(-1);
      const btn = [...form.querySelectorAll('button,[type=submit]')].filter(isVisible).find((b) => b.getBoundingClientRect().top >= (last ? last.bottom : 0));
      if (last && btn) {
        const g = round(btn.getBoundingClientRect().top - last.bottom);
        const minGap = gaps.length ? Math.min(...gaps) : NORMS.fieldGap[0];
        if (g < minGap)
          add('form.button-gap', 'WARN', btn, `${g}px`, `≥ field gap (${minGap}px), typically ${NORMS.buttonGapTypical[0]}–${NORMS.buttonGapTypical[1]}px`, `Button ${sel(btn)} is ${g}px below the last field, closer than the fields are to each other (${minGap}px); norm ${NORMS.buttonGapTypical[0]}–${NORMS.buttonGapTypical[1]}px.`);
      }
    }
  }

  function auditText(root, add) {
    const sizes = new Map();
    const els = [...root.querySelectorAll('*')].filter((el) => ownText(el).length > 0 && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(el.tagName) && isVisible(el));
    for (const el of els) {
      const s = getComputedStyle(el);
      const size = px(s.fontSize);
      sizes.set(size, (sizes.get(size) || 0) + 1);
      // contrast
      const fg = toRGBA(s.color);
      const { rgb: bg, hasImage } = effectiveBg(el);
      const color = blend(fg, bg);
      const r = ratio(color, bg);
      const bold = +s.fontWeight >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      const need = large ? NORMS.largeTextContrast : NORMS.textContrast;
      if (r < need && !hasImage)
        add('contrast.text', 'FAIL', el, fmtRatio(r), `≥ ${need}:1`, `Text "${ownText(el).slice(0, 40)}" is ${fmtRatio(r)} on its background; norm ${need}:1.`);
      else if (r < need && hasImage)
        add('contrast.text', 'NOTE', el, fmtRatio(r), `≥ ${need}:1`, `Text "${ownText(el).slice(0, 40)}" sits on an image or gradient: check its contrast by eye.`);
      // line height (body text only)
      const lh = s.lineHeight === 'normal' ? 1.2 : px(s.lineHeight) / size;
      if (size < 24 && ownText(el).length > 80 && (lh < NORMS.bodyLineHeight[0] || lh > NORMS.bodyLineHeight[1]))
        add('type.line-height', 'WARN', el, lh.toFixed(2), `${NORMS.bodyLineHeight[0]}–${NORMS.bodyLineHeight[1]}`, `Line height ${lh.toFixed(2)} on ${sel(el)}; body text reads best at ${NORMS.bodyLineHeight[0]}–${NORMS.bodyLineHeight[1]}.`);
      // line length
      const text = ownText(el);
      const rect = el.getBoundingClientRect();
      if (text.length > 120 && rect.height > 2.5 * (s.lineHeight === 'normal' ? size * 1.2 : px(s.lineHeight))) {
        ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
        const avg = ctx.measureText(text).width / text.length || size * 0.5;
        const chars = round((rect.width - px(s.paddingLeft) - px(s.paddingRight)) / avg);
        if (chars > NORMS.lineLengthWarn)
          add('type.line-length', 'WARN', el, `${chars}ch`, `${NORMS.lineLength[0]}–${NORMS.lineLength[1]}ch`, `Lines in ${sel(el)} run about ${chars} characters; norm ${NORMS.lineLength[0]}–${NORMS.lineLength[1]}.`);
      }
    }
    if (sizes.size > NORMS.maxFontSizes)
      add('type.size-count', 'WARN', root, `${sizes.size} sizes`, `≤ ${NORMS.maxFontSizes}`, `${sizes.size} different font sizes on screen (${[...sizes.keys()].sort((a, b) => a - b).join(', ')}px); keep to ${NORMS.maxFontSizes} or fewer.`);
  }

  function auditControls(root, add) {
    const targets = [...root.querySelectorAll('button,a[href],[role=button],input[type=checkbox],input[type=radio],select,summary')].filter(isVisible);
    const rects = targets.map((el) => el.getBoundingClientRect());
    // WCAG 2.5.8 spacing exception: an undersized target passes if a 24px circle on its centre
    // does not reach any other target. We still WARN: 44px is the bar for touch.
    const spaced = (i) => {
      const r = rects[i];
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = NORMS.target / 2;
      return rects.every((o, j) => {
        if (j === i) return true;
        const dx = Math.max(o.left - cx, 0, cx - o.right), dy = Math.max(o.top - cy, 0, cy - o.bottom);
        if (Math.hypot(dx, dy) < rad) return false;
        // two undersized targets: their 24px circles must not overlap either
        const small = o.width < NORMS.target || o.height < NORMS.target;
        return !small || Math.hypot(o.left + o.width / 2 - cx, o.top + o.height / 2 - cy) >= NORMS.target;
      });
    };
    targets.forEach((el, i) => {
      const r = rects[i];
      const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && ownText(el.parentElement).length > 0;
      if (inlineLink) return;
      if (r.width < NORMS.target || r.height < NORMS.target) {
        const ok = spaced(i);
        add('target.size', ok ? 'WARN' : 'FAIL', el, `${round(r.width)}×${round(r.height)}px`, `≥ ${NORMS.target}×${NORMS.target}px (44 on touch)`, `Target ${sel(el)} is ${round(r.width)}×${round(r.height)}px; minimum ${NORMS.target}×${NORMS.target}px${ok ? ' (passes only through spacing)' : ''}, 44px for touch or primary actions.`);
      }
    });
    const inputs = [...root.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),select,textarea')].filter(isVisible);
    for (const el of inputs) {
      const s = getComputedStyle(el);
      const outside = effectiveBg(el.parentElement || el).rgb;
      const inside = blend(toRGBA(s.backgroundColor), outside);
      const fillRatio = ratio(inside, outside);
      const bw = px(s.borderBottomWidth);
      const borderRatio = bw > 0 ? ratio(blend(toRGBA(s.borderBottomColor), outside), outside) : 0;
      const best = Math.max(fillRatio, borderRatio);
      if (best < NORMS.nonTextContrast)
        add('contrast.non-text', 'FAIL', el, fmtRatio(best), `≥ ${NORMS.nonTextContrast}:1`, `Field ${sel(el)} outline is ${fmtRatio(best)} against its surroundings; norm ${NORMS.nonTextContrast}:1 so the field can be found.`);
    }
  }

  function auditSpacingGrid(root, add) {
    const off = new Map();
    const props = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'];
    for (const el of [...root.querySelectorAll('*')].filter(isVisible)) {
      const s = getComputedStyle(el);
      for (const p of props) {
        const v = px(s[p]);
        if (v > 2 && Math.abs(v - round(v)) < 0.01 && round(v) % NORMS.grid !== 0) {
          const k = round(v);
          if (!off.has(k)) off.set(k, { count: 0, el });
          off.get(k).count++;
        }
      }
    }
    for (const [v, { count, el }] of off)
      add('spacing.off-grid', 'NOTE', el, `${v}px`, `multiple of ${NORMS.grid}px`, `${v}px spacing used ${count}× (first: ${sel(el)}); the scale is in steps of ${NORMS.grid}px.`);
  }

  function auditMotion(root, add) {
    const seen = new Set();
    for (const el of [...root.querySelectorAll('*')].filter(isVisible)) {
      const s = getComputedStyle(el);
      const durs = s.transitionDuration.split(',').map((d) => (d.trim().endsWith('ms') ? px(d) : px(d) * 1000));
      const max = Math.max(0, ...durs);
      if (max > NORMS.transitionMax && !seen.has(max)) {
        seen.add(max);
        add('motion.duration', 'WARN', el, `${max}ms`, `≤ 300ms micro, ≤ ${NORMS.transitionMax}ms panels`, `Transition of ${max}ms on ${sel(el)}; micro-interactions 100–200ms, panels 200–400ms.`);
      }
    }
  }

  window.__talkupAudit = (options = {}) => {
    const root = document.querySelector(options.root || 'body') || document.body;
    ignoreSel = DEFAULT_IGNORE.concat(options.ignore || []).join(',');
    const findings = [];
    const add = (rule, severity, el, measured, norm, message) => findings.push({ rule, severity, selector: el ? sel(el) : '', measured, norm, message });
    auditForms(root, add);
    auditText(root, add);
    auditControls(root, add);
    auditSpacingGrid(root, add);
    auditMotion(root, add);
    return { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light', findings };
  };
  window.__talkupAuditNorms = NORMS;
})();
