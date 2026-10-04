/** Inspect authored visible copy and control surfaces inside page.evaluate.
 * Required notation belongs in code. User output belongs in data-user-content.
 * A specific data-copy-notation value must describe an unavoidable notation.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectInterface() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  const acronyms = new Set([
    'HTML',
    'CSS',
    'API',
    'AI',
    'SI',
    'JSON',
    'ZIP',
    'TAR',
    'AES',
    'URL',
    'QR',
    'SMS',
    'PDF',
    'PNG',
    'SVG',
    'ICO',
    'PHAR',
    'UTF',
    'RGB',
    'HSL',
    'HSV',
    'CMYK',
    'HTTP',
    'HTTPS',
    'SQL',
    'WPA',
    'WPA2',
    'WEP',
    'WGS',
    'SEO',
    'AEO',
    'GEO',
    'WCAG',
    'VINASIG',
    'CDC',
    'WHO',
    'NHS',
    'NVQS',
    'BMI',
    'KB',
    'MB',
    'GB',
    'TB',
    'AM',
    'PM',
  ]);
  /** @param {Element} element */
  function visible(element) {
    const style = getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.getClientRects().length > 0
    );
  }
  /** @param {Element} element @param {string} text @param {string} kind */
  function add(element, text, kind) {
    findings.push({
      kind,
      text,
      element: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
    });
  }
  /** @param {Element} element @param {string} raw */
  function inspect(element, raw) {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (text.includes(';')) add(element, text, 'semicolon');
    if (text.includes('•')) add(element, text, 'round-bullet');
    if (/[–—]/.test(text)) add(element, text, 'long-dash');
    if (/\s\/\s/.test(text)) add(element, text, 'slash-separator');
    if (/:\s/.test(text)) add(element, text, 'label-colon');
    if (/\([^)]*[\p{L}][^)]*\)/u.test(text))
      add(element, text, 'parenthetical-copy');
    const words =
      text.replace(/#[a-f\d]{3,8}\b/gi, '').match(/\p{L}{2,}/gu) ?? [];
    if (
      words.length &&
      words.every((word) => word === word.toUpperCase()) &&
      words.some((word) => !acronyms.has(word))
    )
      add(element, text, 'all-caps-copy');
    if (getComputedStyle(element).textTransform === 'uppercase' && words.length)
      add(element, text, 'uppercase-style');
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (const element of document.querySelectorAll('[data-copy-notation]')) {
    if (
      !['SPAN', 'A', 'P', 'INPUT', 'TEXTAREA', 'ABBR', 'TIME'].includes(
        element.tagName,
      ) ||
      (element.getAttribute('data-copy-notation')?.trim().length ?? 0) < 3 ||
      (element.textContent?.length ?? 0) > 200 ||
      element.children.length > 1
    )
      add(
        element,
        element.textContent?.trim() ?? '',
        'invalid-notation-exception',
      );
  }
  while (walker.nextNode()) {
    const element = walker.currentNode.parentElement;
    if (
      !element ||
      !visible(element) ||
      element.closest(
        'script,style,svg,pre,code,textarea,[data-user-content],[data-copy-notation]',
      )
    )
      continue;
    inspect(element, walker.currentNode.textContent ?? '');
  }
  for (const element of document.querySelectorAll(
    'input[placeholder],textarea[placeholder]',
  )) {
    if (visible(element) && !element.closest('[data-copy-notation]'))
      inspect(element, element.getAttribute('placeholder') ?? '');
  }
  for (const element of document.querySelectorAll('li')) {
    if (
      visible(element) &&
      ['disc', 'circle', 'square'].includes(
        getComputedStyle(element).listStyleType,
      )
    )
      add(element, element.textContent?.trim() ?? '', 'default-list-marker');
  }
  for (const element of document.querySelectorAll(
    'select,input[type="date"],input[type="time"],input[type="color"]',
  )) {
    if (visible(element))
      add(element, element.getAttribute('type') ?? 'select', 'platform-popup');
  }
  for (const element of document.querySelectorAll('input[type="range"]')) {
    if (visible(element) && getComputedStyle(element).appearance !== 'none')
      add(element, 'range', 'platform-slider');
  }
  return findings;
}

/** Inspect full control surfaces, including native subparts and popup scrollbars.
 * This is a structural gate. Open screenshots and exercise real controls too.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectControlSurfaces() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  const forced = matchMedia('(forced-colors: active)').matches;
  /** @param {Element} element */
  function visible(element) {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (
      style.display === 'none' ||
      style.visibility !== 'visible' ||
      Number(style.opacity) === 0 ||
      box.width <= 1 ||
      box.height <= 1
    )
      return false;
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      if (
        parent instanceof HTMLDetailsElement &&
        !parent.open &&
        !parent.querySelector('summary')?.contains(element)
      )
        return false;
      const ancestorStyle = getComputedStyle(parent);
      if (
        ancestorStyle.display === 'none' ||
        ancestorStyle.visibility !== 'visible' ||
        Number(ancestorStyle.opacity) === 0
      )
        return false;
    }
    return true;
  }
  /** @param {Element} element @param {string} kind @param {string} text */
  const add = (element, kind, text) =>
    findings.push({
      kind,
      text,
      element: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
    });
  /** @type {CSSStyleRule[]} */
  const rules = [];
  /** @param {CSSRuleList} list */
  function collect(list) {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule) rules.push(rule);
      else if (rule instanceof CSSMediaRule) {
        if (matchMedia(rule.conditionText).matches) collect(rule.cssRules);
      } else if (rule instanceof CSSSupportsRule) {
        if (CSS.supports(rule.conditionText)) collect(rule.cssRules);
      } else if ('cssRules' in rule)
        collect(/** @type {CSSGroupingRule} */ (rule).cssRules);
      else if (rule instanceof CSSImportRule && rule.styleSheet)
        collect(rule.styleSheet.cssRules);
    }
  }
  for (const sheet of [
    ...document.styleSheets,
    ...document.adoptedStyleSheets,
  ]) {
    try {
      collect(sheet.cssRules);
    } catch {
      add(
        document.documentElement,
        'control-styles-unreadable',
        'Cannot inspect a control stylesheet',
      );
    }
  }
  /** @param {Element} element @param {string} pseudo */
  function authoredPart(element, pseudo) {
    return rules.some(
      (rule) =>
        rule.selectorText.split(',').some((selector) => {
          const index = selector.indexOf(pseudo);
          if (index < 0) return false;
          try {
            return element.matches(selector.slice(0, index).trim() || '*');
          } catch {
            return false;
          }
        }) &&
        (rule.style.getPropertyValue('background') ||
          rule.style.getPropertyValue('background-color')),
    );
  }
  for (const element of document.querySelectorAll(
    'input[type="checkbox"],input[type="radio"],input[type="range"],input[type="search"],progress,meter',
  )) {
    if (!visible(element) || forced) continue;
    const style = getComputedStyle(element);
    if (style.appearance !== 'none')
      add(
        element,
        'control-native-surface',
        'Control still uses a platform appearance',
      );
    if (
      element instanceof HTMLInputElement &&
      ['checkbox', 'radio'].includes(element.type) &&
      (element.checked || element.indeterminate) &&
      style.appearance === 'none'
    ) {
      const hasMark = ['::before', '::after'].some((pseudo) => {
        const mark = getComputedStyle(element, pseudo);
        return (
          !['none', 'normal'].includes(mark.content) &&
          mark.display !== 'none' &&
          Number(mark.opacity) > 0 &&
          parseFloat(mark.width) > 1 &&
          parseFloat(mark.height) > 1
        );
      });
      if (!hasMark && style.backgroundImage === 'none')
        add(
          element,
          'control-selection-mark',
          'Selected control has no authored visible mark',
        );
    }
    if (element instanceof HTMLInputElement && element.type === 'range') {
      const parts = CSS.supports('selector(input::-moz-range-thumb)')
        ? ['::-moz-range-track', '::-moz-range-thumb']
        : ['::-webkit-slider-runnable-track', '::-webkit-slider-thumb'];
      for (const part of parts)
        if (!authoredPart(element, part))
          add(
            element,
            'control-range-part',
            `Missing authored ${part} surface`,
          );
    }
    if (
      element instanceof HTMLProgressElement ||
      element instanceof HTMLMeterElement
    ) {
      const part =
        element instanceof HTMLProgressElement
          ? CSS.supports('selector(progress::-moz-progress-bar)')
            ? '::-moz-progress-bar'
            : '::-webkit-progress-value'
          : CSS.supports('selector(meter::-moz-meter-bar)')
            ? '::-moz-meter-bar'
            : '::-webkit-meter-optimum-value';
      if (!authoredPart(element, part))
        add(
          element,
          'control-progress-part',
          'Missing authored progress or meter value',
        );
    }
  }
  for (const element of new Set([
    document.documentElement,
    ...document.querySelectorAll('*'),
  ])) {
    if (!visible(element) || forced) continue;
    const style = getComputedStyle(element);
    const scrolls =
      element === document.documentElement ||
      (/(auto|scroll)/.test(style.overflowY) &&
        element.scrollHeight > element.clientHeight + 1) ||
      (/(auto|scroll)/.test(style.overflowX) &&
        element.scrollWidth > element.clientWidth + 1);
    if (
      scrolls &&
      (!style.scrollbarColor || style.scrollbarColor === 'auto') &&
      !(
        CSS.supports('selector(::-webkit-scrollbar-thumb)') &&
        authoredPart(element, '::-webkit-scrollbar-thumb')
      )
    )
      add(
        element,
        'control-scrollbar',
        'Scrollable surface has an unstyled platform scrollbar',
      );
  }
  for (const element of document.querySelectorAll('summary')) {
    if (!visible(element)) continue;
    const marker = getComputedStyle(element, '::marker');
    const before = getComputedStyle(element, '::before');
    if (
      getComputedStyle(element).listStyleType !== 'none' &&
      marker.content === 'normal'
    )
      add(
        element,
        'control-disclosure-marker',
        'Disclosure still uses the platform marker',
      );
    if (before.maskImage === 'none' && !element.querySelector('svg'))
      add(
        element,
        'control-disclosure-indicator',
        'Missing authored disclosure indicator',
      );
  }
  for (const trigger of document.querySelectorAll(
    '[aria-expanded="true"][aria-controls]',
  )) {
    if (
      !visible(trigger) ||
      (!trigger.hasAttribute('aria-haspopup') &&
        trigger.getAttribute('role') !== 'combobox')
    )
      continue;
    const panel = document.getElementById(
      trigger.getAttribute('aria-controls') ?? '',
    );
    if (!panel || !visible(panel)) {
      add(
        trigger,
        'control-popup-missing',
        'Expanded control has no visible popup',
      );
      continue;
    }
    const box = panel.getBoundingClientRect();
    const style = getComputedStyle(panel);
    const anchor = trigger.getBoundingClientRect();
    // In-flow catalog examples and their anchors can be below the current
    // fold. Test their viewport fit after bringing the actual control into
    // view. A fixed popup still has to fit regardless of its anchor position.
    const inViewport =
      style.position === 'fixed' ||
      (anchor.bottom > 0 &&
        anchor.top < innerHeight &&
        anchor.right > 0 &&
        anchor.left < innerWidth);
    if (
      inViewport &&
      (box.left < -1 ||
        box.top < -1 ||
        box.right > innerWidth + 1 ||
        box.bottom > innerHeight + 1)
    )
      add(panel, 'control-popup-viewport', 'Open control exceeds the viewport');
    if (['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor))
      add(
        panel,
        'control-popup-surface',
        'Open control has no authored surface',
      );
  }
  return findings;
}

/** Measure ordinary select indicators in initial and enhanced HTML. */
export function inspectControlIndicators() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  /** @param {Element} element */
  const visible = (element) => {
    const style = getComputedStyle(element);
    if (
      style.display === 'none' ||
      style.visibility !== 'visible' ||
      !element.getClientRects().length
    )
      return false;
    /** @type {Element | null} */
    let ancestor = element;
    while (ancestor) {
      if (
        ancestor instanceof HTMLDetailsElement &&
        !ancestor.open &&
        !ancestor.querySelector('summary')?.contains(element)
      )
        return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  };
  const controls = new Set(document.querySelectorAll('.select-control'));
  for (const indicator of document.querySelectorAll(
    '[data-control-indicator]',
  )) {
    const control = indicator.closest('button, [role="combobox"]');
    if (control) controls.add(control);
  }
  for (const control of controls) {
    if (!visible(control)) continue;
    /** @param {string} kind @param {string} text */
    const add = (kind, text) =>
      findings.push({
        kind,
        text,
        element: control.id || control.tagName.toLowerCase(),
      });
    const indicator = control.querySelector('[data-control-indicator]');
    const value = control.querySelector('[data-control-value]');
    if (!indicator || !value) {
      add(
        'control-indicator-markup',
        'Missing measurable selected value or indicator',
      );
      continue;
    }
    if (!visible(indicator) || !visible(value)) {
      add('control-indicator-hidden', 'Selected value or indicator is hidden');
      continue;
    }
    const box = control.getBoundingClientRect();
    const icon = indicator.getBoundingClientRect();
    const text = value.getBoundingClientRect();
    const style = getComputedStyle(control);
    const left = box.left + parseFloat(style.borderLeftWidth);
    const right = box.right - parseFloat(style.borderRightWidth);
    const rtl = style.direction === 'rtl';
    const inset = rtl ? icon.left - left : right - icon.right;
    const gap = rtl ? text.left - icon.right : icon.left - text.right;
    // Only accommodate floating point representation, never a layout pixel.
    const epsilon = 0.01;
    if (inset + epsilon < 16)
      add(
        'control-indicator-inset',
        `Trailing inset is ${inset.toFixed(2)} CSS px, expected at least 16`,
      );
    if (gap + epsilon < 12)
      add(
        'control-indicator-gap',
        `Value gap is ${gap.toFixed(2)} CSS px, expected at least 12`,
      );
    const declaredWidth = Number(indicator.getAttribute('width'));
    const declaredHeight = Number(indicator.getAttribute('height'));
    if (
      !(declaredWidth > 0 && declaredHeight > 0) ||
      icon.width + epsilon < declaredWidth ||
      icon.height + epsilon < declaredHeight
    )
      add(
        'control-indicator-size',
        'Indicator must keep its declared dimensions',
      );
    if (
      icon.left < left - epsilon ||
      icon.right > right + epsilon ||
      icon.top < box.top + parseFloat(style.borderTopWidth) - epsilon ||
      icon.bottom >
        box.bottom - parseFloat(style.borderBottomWidth) + epsilon ||
      text.left < left - epsilon ||
      text.right > right + epsilon ||
      value.scrollWidth > text.width + 1
    )
      add(
        'control-indicator-clipping',
        'Value or indicator exceeds its control',
      );
  }
  return findings;
}

/** Inspect the explicit VINASIG header logo after its image has loaded.
 * The consumer must separately pin and verify the original asset bytes.
 * This checks presentation, variant selection and geometry, not artwork rights.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectHeaderBrand() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  const links = [...document.querySelectorAll('[data-brand-logo]')];
  /** @param {Element} element @param {string} kind @param {string} text */
  const add = (element, kind, text) =>
    findings.push({
      kind,
      text,
      element: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
    });
  if (links.length !== 1) {
    findings.push({
      kind: 'header-logo-count',
      text: String(links.length),
      element: '[data-brand-logo]',
    });
    return findings;
  }
  const link = links[0];
  if (!link) return findings;
  if (!(link instanceof HTMLAnchorElement) || !link.href)
    add(link, 'header-logo-link', 'Use a named logo link');
  else if (link.href !== 'https://vinasig.io.vn/')
    add(
      link,
      'header-logo-home',
      'The VINASIG logo must link to https://vinasig.io.vn/',
    );
  const image = link.querySelector('img');
  if (!image || !image.complete || image.naturalWidth === 0) {
    add(link, 'header-logo-image', 'The supplied image must load');
    return findings;
  }
  if (!image.alt.trim())
    add(image, 'header-logo-name', 'The logo needs alternative text');
  for (const element of [link, ...link.querySelectorAll('picture,img')]) {
    const style = getComputedStyle(element);
    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (rgba.length === 3 || (rgba[3] ?? 0) > 0)
      add(element, 'header-logo-background', style.backgroundColor);
    if (
      style.backgroundImage !== 'none' ||
      style.boxShadow !== 'none' ||
      style.filter !== 'none' ||
      Number(style.opacity) !== 1
    )
      add(
        element,
        'header-logo-effect',
        'Keep the original artwork without panel effects',
      );
    if (
      [
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ].some((value) => parseFloat(value) > 0.5)
    )
      add(
        element,
        'header-logo-frame',
        'Use surrounding layout spacing without a padded logo card',
      );
    if (
      element === image &&
      [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomLeftRadius,
        style.borderBottomRightRadius,
      ].some((value) => parseFloat(value) > 0)
    )
      add(element, 'header-logo-crop', 'Keep the complete unrounded artwork');
  }
  const target = link.getBoundingClientRect();
  if (target.width < 44 || target.height < 44)
    add(link, 'header-logo-target', `${target.width} x ${target.height}`);
  const bounds = image.getBoundingClientRect();
  // The supported original horizontal exports share this reviewed viewBox.
  // Their percentage dimensions produce rounded naturalWidth/naturalHeight
  // values that differ between engines. Do not infer the artwork ratio from
  // that raster fallback or request an asset during a user's local workflow.
  const ratio = 540 / 140;
  const declaredWidth = Number(image.getAttribute('width'));
  const declaredHeight = Number(image.getAttribute('height'));
  if (
    declaredWidth <= 0 ||
    declaredHeight <= 0 ||
    Math.abs(declaredWidth / declaredHeight - ratio) > 0.0001
  )
    add(
      image,
      'header-logo-intrinsic-ratio',
      'Declare the original aspect ratio',
    );
  if (
    bounds.height <= 0 ||
    Math.abs(bounds.width / bounds.height - ratio) > 0.02
  )
    add(image, 'header-logo-ratio', 'Preserve the original image aspect ratio');
  /** @type {number | undefined} */
  let luminance;
  for (
    let surface = link.parentElement;
    surface;
    surface = surface.parentElement
  ) {
    const style = getComputedStyle(surface);
    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (
      !style.backgroundColor.startsWith('rgb') ||
      rgba.length < 3 ||
      (rgba[3] ?? 1) < 0.99
    )
      continue;
    const linear = rgba.slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    luminance =
      (linear[0] ?? 0) * 0.2126 +
      (linear[1] ?? 0) * 0.7152 +
      (linear[2] ?? 0) * 0.0722;
    break;
  }
  if (luminance === undefined)
    add(link, 'header-logo-surface', 'Inspect the actual logo surface');
  else {
    const filename = new URL(image.currentSrc || image.src).pathname
      .split('/')
      .pop();
    const supported =
      luminance < 0.179
        ? ['reversed.svg', 'monochrome-white.svg']
        : ['primary-color.svg', 'color-black.svg', 'monochrome-black.svg'];
    if (!filename || !supported.includes(filename))
      add(
        image,
        'header-logo-variant',
        `${filename ?? 'unknown'} on ${luminance < 0.179 ? 'dark' : 'light'} surface`,
      );
  }
  return findings;
}
