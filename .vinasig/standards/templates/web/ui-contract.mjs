/**
 * Structural UI acceptance diagnostics. No field values are returned.
 * @param {{cards?: {selector:string,count:number,singleRow?:boolean,minGap?:number}[], icons?: {selector:string,count:number,label:string}[], errors?: string[], outputs?: {selector:string,actions:string,maxGap?:number}[], rows?: {selector:string,members:string,count:number}[], progress?: string[]}} spec
 */
export function inspectUiContract(spec) {
  if (!spec || Object.keys(spec).length === 0)
    throw new Error('Declare the UI acceptance inventory');
  /** @type {{kind:string,element:string,text:string}[]} */
  const findings = [];
  /** @param {string} element @param {string} kind @param {string} text */
  const add = (element, kind, text) => findings.push({ kind, element, text });
  /** @param {Element} element */
  const visible = (element) => {
    const box = element.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return false;
    for (
      let node = /** @type {Element | null} */ (element);
      node;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      if (
        style.display === 'none' ||
        style.visibility !== 'visible' ||
        Number(style.opacity) === 0
      )
        return false;
    }
    return true;
  };
  /** @param {string} selector @param {number} count */
  const inventory = (selector, count) => {
    const nodes = [...document.querySelectorAll(selector)];
    if (nodes.length !== count || count < 1)
      add(
        selector,
        'ui-inventory',
        `Expected ${count} elements, found ${nodes.length}`,
      );
    return nodes;
  };
  for (const group of spec.cards ?? []) {
    const container = inventory(group.selector, 1)[0];
    if (!container || !visible(container)) continue;
    const cards = [...container.querySelectorAll('[data-choice-card]')];
    if (cards.length !== group.count || group.count < 2)
      add(
        group.selector,
        'ui-card-inventory',
        'Choice card count does not match the declared group',
      );
    const selected = cards.filter((card) =>
      card.querySelector('input:checked'),
    );
    if (selected.length !== 1)
      add(
        group.selector,
        'ui-card-selection',
        'A radio group must have one selected card',
      );
    const names = new Set();
    for (const card of cards) {
      const radios = card.querySelectorAll('input[type="radio"]');
      const radio = radios[0];
      if (
        !(card instanceof HTMLLabelElement) ||
        radios.length !== 1 ||
        !(radio instanceof HTMLInputElement) ||
        !radio.name ||
        radio.labels?.[0] !== card
      ) {
        add(
          group.selector,
          'ui-card-semantics',
          'Each card needs its own labelled native radio',
        );
        continue;
      }
      names.add(radio.name);
      const style = getComputedStyle(radio);
      if (
        style.display === 'none' ||
        style.visibility !== 'visible' ||
        radio.hidden ||
        radio.tabIndex < 0
      )
        add(
          group.selector,
          'ui-card-semantics',
          'Native radio must retain focus and accessibility',
        );
      if (Number(style.opacity) !== 0)
        add(
          group.selector,
          'ui-card-marker',
          'Card selection duplicates a visible radio marker',
        );
    }
    if (names.size !== 1)
      add(
        group.selector,
        'ui-card-semantics',
        'Choice cards must share one native radio group',
      );
    if (!matchMedia('(forced-colors: active)').matches && selected[0]) {
      const selectedStyle = getComputedStyle(selected[0]);
      const distinct = cards
        .filter((card) => card !== selected[0])
        .every((card) => {
          const style = getComputedStyle(card);
          return (
            selectedStyle.backgroundColor !== style.backgroundColor ||
            selectedStyle.borderColor !== style.borderColor ||
            selectedStyle.outlineColor !== style.outlineColor
          );
        });
      if (!distinct)
        add(
          group.selector,
          'ui-card-selection',
          'Selected card has no distinct authored presentation',
        );
    }
    const boxes = cards.map((card) => card.getBoundingClientRect());
    for (let i = 0; i < boxes.length; i++) {
      const a = boxes[i];
      if (!a) continue;
      if (group.singleRow && Math.abs(a.top - (boxes[0]?.top ?? a.top)) > 1)
        add(
          group.selector,
          'ui-card-row',
          'Declared desktop choices do not share a row',
        );
      for (const b of boxes.slice(i + 1)) {
        const x = Math.max(a.left - b.right, b.left - a.right);
        const y = Math.max(a.top - b.bottom, b.top - a.bottom);
        if (Math.max(x, y) < (group.minGap ?? 8) - 0.1)
          add(
            group.selector,
            'ui-card-gap',
            'Choice cards touch or have insufficient spacing',
          );
      }
    }
  }
  for (const row of spec.icons ?? []) {
    for (const node of inventory(row.selector, row.count)) {
      if (!visible(node)) continue;
      const icon = node.querySelector('svg');
      const label = node.querySelector(row.label);
      if (!icon || !label) {
        add(
          row.selector,
          'ui-icon-inventory',
          'Icon row needs an SVG and a labelled text box',
        );
        continue;
      }
      const a = icon.getBoundingClientRect();
      const b = label.getBoundingClientRect();
      if (Math.abs(a.top + a.height / 2 - b.top - b.height / 2) > 1)
        add(
          row.selector,
          'ui-icon-alignment',
          'Icon and text box centers differ by more than 1 px',
        );
    }
  }
  for (const selector of spec.errors ?? []) {
    for (const control of document.querySelectorAll(selector)) {
      if (!visible(control) || control.getAttribute('aria-invalid') !== 'true')
        continue;
      const linked = (control.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .map((id) => document.getElementById(id));
      const error = linked.find(
        (node) =>
          node &&
          visible(node) &&
          node.classList.contains('field-error') &&
          node.textContent?.trim(),
      );
      if (!error) {
        add(
          selector,
          'ui-field-error-link',
          'Invalid field lacks a linked, visible local error',
        );
        continue;
      }
      const a = control.getBoundingClientRect();
      const b = error.getBoundingClientRect();
      if (
        b.top < a.top - 1 ||
        b.top - a.bottom > 96 ||
        b.left > a.right ||
        b.right < a.left
      )
        add(
          selector,
          'ui-field-error-position',
          'Error is detached from its field',
        );
    }
  }
  for (const output of spec.outputs ?? []) {
    const node = inventory(output.selector, 1)[0];
    const actions = inventory(output.actions, 1)[0];
    if (!node || !actions || !visible(node) || !visible(actions)) continue;
    const a = node.getBoundingClientRect();
    const b = actions.getBoundingClientRect();
    if (b.top < a.bottom - 1 || b.top - a.bottom > (output.maxGap ?? 16) + 0.1)
      add(
        output.selector,
        'ui-output-actions',
        'Direct result actions are detached from the result',
      );
    const content = [
      node,
      ...node.querySelectorAll('textarea, pre, [data-output-content]'),
    ];
    if (
      content.some(
        (part) =>
          part.scrollHeight > part.clientHeight + 1 ||
          part.scrollWidth > part.clientWidth + 1,
      )
    )
      add(
        output.selector,
        'ui-output-fit',
        'Output content does not fit its display',
      );
  }
  for (const row of spec.rows ?? []) {
    const container = inventory(row.selector, 1)[0];
    if (!container || !visible(container)) continue;
    const members = [...container.querySelectorAll(row.members)];
    if (members.length !== row.count || row.count < 2) {
      add(
        row.selector,
        'ui-row-inventory',
        'Aligned row does not match its declared members',
      );
      continue;
    }
    const centers = members.map((node) => {
      const box = node.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    if (Math.max(...centers) - Math.min(...centers) > 1)
      add(
        row.selector,
        'ui-row-alignment',
        'Declared inline row members are not vertically centered',
      );
  }
  for (const selector of spec.progress ?? []) {
    const node = inventory(selector, 1)[0];
    if (
      !node ||
      !visible(node) ||
      matchMedia('(forced-colors: active)').matches
    )
      continue;
    const style = getComputedStyle(node);
    let parent = node.parentElement;
    while (
      parent &&
      ['transparent', 'rgba(0, 0, 0, 0)'].includes(
        getComputedStyle(parent).backgroundColor,
      )
    )
      parent = parent.parentElement;
    if (
      style.backgroundColor === style.color ||
      !parent ||
      style.backgroundColor === getComputedStyle(parent).backgroundColor ||
      ['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor)
    )
      add(
        selector,
        'ui-progress-track',
        'Depleted track is indistinguishable from value or surface',
      );
  }
  return findings;
}
