// Demo "vende / controla": el celular (cliente) alimenta el panel (dueño) en vivo. Datos simulados.
export function initDuo() {
  const root = document.querySelector('[data-duo]'); if (!root) return;
  const L = JSON.parse(root.dataset.labels);
  const fmt = new Intl.NumberFormat(root.dataset.locale, { style: 'currency', currency: root.dataset.currency });
  const num = new Intl.NumberFormat(root.dataset.locale);
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const cart = new Map(); let carted = false;
  const m = { sales: 1842, orders: 96, visits: 1284, carts: 312, checkout: 148, paid: 96, seq: 1043, series: [3, 5, 4, 7, 6, 9, 8, 11, 10, 13] };
  const feed = $('[data-feed]'), orderBtn = $('[data-order]'), total = $('[data-cart-total]'), label = $('[data-cart-label]'), thanks = $('[data-thanks]');
  const seedFeed = [[1042, 14.5, true], [1041, 9.5, false], [1040, 22, true]];

  const sum = () => [...cart].reduce((a, [i, q]) => a + q * Number($$('[data-item]')[i].dataset.price), 0);
  const items = () => [...cart.values()].reduce((a, q) => a + q, 0);
  const spark = () => {
    const s = m.series.slice(-14), max = Math.max(...s, 1), step = 240 / Math.max(s.length - 1, 1);
    const pts = s.map((v, i) => `${(i * step).toFixed(1)},${(56 - (v / max) * 50).toFixed(1)}`).join(' ');
    $('[data-spark]').setAttribute('points', pts); $('[data-spark-fill]').setAttribute('points', `0,60 ${pts} 240,60`);
  };
  const render = () => {
    $('[data-k=sales]').textContent = fmt.format(m.sales);
    $('[data-k=orders]').textContent = num.format(m.orders);
    $('[data-k=ticket]').textContent = fmt.format(m.sales / m.orders);
    const vals = [m.visits, m.carts, m.checkout, m.paid];
    $$('.frow').forEach((r, i) => { r.querySelector('i').style.width = `${(vals[i] / m.visits) * 100}%`; r.querySelector('b').textContent = num.format(vals[i]); });
    spark();
  };
  const flash = (...ks) => ks.forEach((k) => { const el = $(`[data-k=${k}]`); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); });
  const addFeed = (n, amt, ret, fresh) => {
    const li = document.createElement('li'); if (fresh) li.className = 'fresh';
    li.innerHTML = `<span>${L.order_word} #${n} · ${fmt.format(amt)}</span><small>${ret ? L.ret : L.newC}</small>`;
    feed.prepend(li); while (feed.children.length > 4) feed.lastChild.remove();
    setTimeout(() => li.classList.remove('fresh'), 2500);
  };
  const cartUI = () => {
    $$('[data-item]').forEach((li, i) => (li.querySelector('output').textContent = cart.get(i) || 0));
    const s = sum(); total.textContent = items() ? fmt.format(s) : ''; label.textContent = items() ? `${items()} · ${L.total}` : L.empty; orderBtn.disabled = !items();
  };
  const ping = () => { const w = $('.wire'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); };

  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.closest('[data-item]').dataset.item); cart.set(i, (cart.get(i) || 0) + 1);
    if (!carted) { carted = true; m.visits++; m.carts++; render(); ping(); } cartUI();
  }));
  $$('[data-rm]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.closest('[data-item]').dataset.item); const q = (cart.get(i) || 0) - 1; q > 0 ? cart.set(i, q) : cart.delete(i); cartUI();
  }));
  orderBtn.addEventListener('click', () => {
    const amt = sum(); if (!amt) return;
    m.sales += amt; m.orders++; m.checkout++; m.paid = m.orders; m.seq++; m.series.push(Math.max(2, Math.round(amt)));
    addFeed(m.seq, amt, Math.random() > 0.45, true); render(); flash('sales', 'orders', 'ticket'); ping();
    thanks.hidden = false; thanks.querySelector('[data-again]').focus();
  });
  $('[data-again]').addEventListener('click', () => { cart.clear(); carted = false; cartUI(); thanks.hidden = true; });

  seedFeed.slice().reverse().forEach(([n, a, r]) => addFeed(n, a, r, false)); render(); cartUI();
}
