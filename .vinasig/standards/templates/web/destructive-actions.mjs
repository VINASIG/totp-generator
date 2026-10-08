/**
 * Inspect an explicit inventory of data-discarding actions without returning content.
 * Call again in enabled, hover, keyboard-focus and opened states in each theme/locale.
 * @param {{selector:string,count:number}[]} inventory
 */
export function inspectDestructiveActions(inventory) {
  if (!Array.isArray(inventory) || inventory.length === 0)
    throw new Error('Declare the destructive action inventory');
  /** @type {{kind:string,element:string,text:string}[]} */
  const findings = [];
  /** @param {string} element @param {string} kind @param {string} text */
  const add = (element, kind, text) => findings.push({ kind, element, text });
  const forced = matchMedia('(forced-colors: active)').matches;
  /** @type {Set<Element>} */
  const declared = new Set();
  /** @param {string} color */
  const rgba = (color) => {
    const values = (color.match(/[\d.]+/g) ?? []).map(Number);
    return color.startsWith('color(srgb')
      ? values.map((value, index) => (index < 3 ? value * 255 : value))
      : values;
  };
  /** @param {number[]} front @param {number[]} back */
  const compose = (front, back) =>
    front.slice(0, 3).map((value, index) => {
      const alpha = front[3] ?? 1;
      return value * alpha + (back[index] ?? 255) * (1 - alpha);
    });
  /** @param {Element | null} element */
  const background = (element) => {
    /** @type {Element[]} */
    const chain = [];
    for (let node = element; node; node = node.parentElement)
      chain.unshift(node);
    return chain.reduce(
      (back, node) =>
        compose(rgba(getComputedStyle(node).backgroundColor), back),
      [255, 255, 255],
    );
  };
  /** @param {number[]} color */
  const luma = (color) =>
    color.slice(0, 3).reduce((sum, value, index) => {
      const channel = value / 255;
      return (
        sum +
        (channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4) *
          ([0.2126, 0.7152, 0.0722][index] ?? 0)
      );
    }, 0);
  /** @param {number[]} first @param {number[]} second */
  const contrast = (first, second) => {
    const a = luma(first);
    const b = luma(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  for (const group of inventory) {
    const nodes = [...document.querySelectorAll(group.selector)];
    if (
      !Number.isInteger(group.count) ||
      group.count < 1 ||
      nodes.length !== group.count
    )
      add(
        group.selector,
        'destructive-inventory',
        'Declared action count does not match the page',
      );
    for (const node of nodes) {
      declared.add(node);
      if (!node.hasAttribute('data-destructive-action'))
        add(
          group.selector,
          'destructive-marker',
          'Data-discarding action needs an explicit semantic marker',
        );
      if (node.tagName !== 'BUTTON' && node.getAttribute('role') !== 'menuitem')
        add(
          group.selector,
          'destructive-semantics',
          'Action needs native button or menuitem semantics',
        );
      if (!(node.getAttribute('aria-label') ?? node.textContent ?? '').trim())
        add(
          group.selector,
          'destructive-name',
          'Action needs a specific accessible name',
        );
      const style = getComputedStyle(node);
      if (!forced) {
        const reference = document.createElement('span');
        reference.style.setProperty('transition', 'none', 'important');
        reference.style.setProperty('animation', 'none', 'important');
        reference.style.setProperty('position', 'absolute', 'important');
        reference.style.setProperty('visibility', 'hidden', 'important');
        reference.style.setProperty('pointer-events', 'none', 'important');
        document.body.append(reference);
        const red = [
          '--color-error',
          '--color-error-accent',
          '--color-auditor-red-strong',
        ]
          .filter((token) => style.getPropertyValue(token).trim())
          .map((token) => {
            reference.style.setProperty(
              'color',
              style.getPropertyValue(token),
              'important',
            );
            return getComputedStyle(reference).color;
          });
        reference.style.setProperty(
          'color',
          style.getPropertyValue('--color-white') || '#fff',
          'important',
        );
        const white = getComputedStyle(reference).color;
        reference.remove();
        const filled =
          node.getAttribute('data-destructive-action') === 'filled';
        if (
          filled
            ? style.color !== white || !red.includes(style.backgroundColor)
            : !red.includes(style.color) ||
              (node.getAttribute('role') !== 'menuitem' &&
                !red.includes(style.borderTopColor))
        )
          add(
            group.selector,
            'destructive-color',
            'Action text and boundary must use the reviewed semantic red',
          );
      }
      const box = node.getBoundingClientRect();
      if (
        box.width < 1 ||
        box.height < 1 ||
        style.visibility !== 'visible' ||
        node.closest('[hidden]') ||
        node.matches(':disabled, [aria-disabled="true"]')
      )
        continue;
      let opacity = 1;
      for (
        let parent = /** @type {Element | null} */ (node);
        parent;
        parent = parent.parentElement
      )
        opacity *= Number(getComputedStyle(parent).opacity);
      if (opacity < 1)
        add(
          group.selector,
          'destructive-opacity',
          'Enabled destructive action must not be faded',
        );
      const inner = background(node);
      const outer = background(node.parentElement);
      if (contrast(compose(rgba(style.color), inner), inner) < 4.5)
        add(
          group.selector,
          'destructive-text-contrast',
          'Enabled action text must reach 4.5:1',
        );
      if (
        node.getAttribute('role') !== 'menuitem' &&
        (parseFloat(style.borderTopWidth) < 1 ||
          Math.max(
            contrast(compose(rgba(style.borderTopColor), outer), outer),
            forced || node.getAttribute('data-destructive-action') === 'filled'
              ? contrast(inner, outer)
              : 0,
          ) < 3)
      )
        add(
          group.selector,
          'destructive-boundary-contrast',
          'Action boundary must reach 3:1 against its actual surroundings',
        );
      for (const icon of node.querySelectorAll('svg')) {
        if (
          contrast(compose(rgba(getComputedStyle(icon).color), inner), inner) <
          3
        )
          add(
            group.selector,
            'destructive-icon-contrast',
            'Action icon must reach 3:1',
          );
      }
      if (
        node.matches(':focus-visible') &&
        (style.outlineStyle === 'none' ||
          parseFloat(style.outlineWidth) < 2 ||
          contrast(compose(rgba(style.outlineColor), outer), outer) < 3)
      )
        add(
          group.selector,
          'destructive-focus',
          'Keyboard focus needs a visible contrasting outline',
        );
    }
  }
  for (const node of document.querySelectorAll('[data-destructive-action]')) {
    if (!declared.has(node))
      add(
        '[data-destructive-action]',
        'destructive-undeclared',
        'A marked action is missing from the declared inventory',
      );
  }
  return findings;
}
