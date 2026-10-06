// Renders the "Premium Modern" invoice as an A4 PDF Buffer. Every section is
// drawn through a `pen` that can run dry (measure only), so page-break
// planning uses exactly the same geometry as the real drawing.

const path = require('path');
const PDFDocument = require('pdfkit');
const BUSINESS = require('../config/business');
const { formatINR } = require('../utils/invoiceUtils');

const ASSETS = path.join(__dirname, '..', 'assets');
const FONTS = {
  light: path.join(ASSETS, 'fonts', 'DMSans-Light.ttf'),
  regular: path.join(ASSETS, 'fonts', 'DMSans-Regular.ttf'),
  medium: path.join(ASSETS, 'fonts', 'DMSans-Medium.ttf'),
  semibold: path.join(ASSETS, 'fonts', 'DMSans-SemiBold.ttf'),
};
const LOGO = path.join(ASSETS, 'logo-badge.jpg');
const LOGO_RATIO = 480 / 270;

const mm = (v) => v * 2.8346457;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const PAD_TOP = mm(15);
const PAD_SIDE = mm(16);
const PAD_BOTTOM = mm(10);
const LEFT = PAD_SIDE;
const CONTENT_W = PAGE_W - PAD_SIDE * 2;
const FOOTER_H = mm(2.6) + 10;
const FOOTER_TOP = PAGE_H - PAD_BOTTOM - FOOTER_H;
const CONTENT_LIMIT = FOOTER_TOP - mm(4);

const C = {
  ink: '#2d1a00',
  muted: '#9a8a76',
  body: '#6b5a45',
  red: '#b8080e',
  gold: '#e9ad1c',
  rule: '#eee6da',
  ruleMid: '#ebe2d4',
  cardBg: '#fbf8e7',
  cardRule: '#e2d3b6',
  tone: {
    paid: { bg: '#e6f0df', ink: '#24491a' },
    due: { bg: '#ffeccc', ink: '#8a4000' },
    cancelled: { bg: '#fde3e3', ink: '#8a0a0f' },
  },
};
// Ligatures off so copied/searched PDF text stays exact ("fi" would otherwise
// extract as a single unmapped glyph, e.g. "Goldfnch").
const TEXT_FEATURES = { liga: false };
const NUM = { liga: false, tnum: true, lnum: true };

const COLS = (() => {
  const gap = mm(5);
  const priceW = mm(30);
  const qtyW = mm(18);
  const amountW = mm(34);
  const itemW = CONTENT_W - priceW - qtyW - amountW;
  return {
    item: { x: LEFT, w: itemW },
    price: { x: LEFT + itemW + gap, w: priceW - gap },
    qty: { x: LEFT + itemW + priceW + gap, w: qtyW - gap },
    amount: { x: LEFT + itemW + priceW + qtyW + gap, w: amountW - gap },
  };
})();

function createPen(doc, dry) {
  const style = ({ font = 'regular', size = 9, color = C.ink } = {}) => {
    doc.font(font).fontSize(size).fillColor(color);
  };
  return {
    doc,
    // Returns the y just below the text block.
    text(str, x, y, opts = {}) {
      const { width, align = 'left', spacing = 0, lineGap = 0, features = TEXT_FEATURES } = opts;
      style(opts);
      const layout = { width, align, characterSpacing: spacing, lineGap, features, lineBreak: width !== undefined };
      const height = doc.heightOfString(String(str), layout);
      if (!dry) doc.text(String(str), x, y, layout);
      return y + height;
    },
    width(str, opts = {}) {
      style(opts);
      return doc.widthOfString(String(str), { characterSpacing: opts.spacing || 0 });
    },
    rule(x1, x2, y, color, weight) {
      if (!dry) doc.moveTo(x1, y).lineTo(x2, y).lineWidth(weight).strokeColor(color).stroke();
    },
    rect(x, y, w, h, color, radius = 0) {
      if (dry) return;
      (radius ? doc.roundedRect(x, y, w, h, radius) : doc.rect(x, y, w, h)).fill(color);
    },
    image(src, x, y, height) {
      if (!dry) doc.image(src, x, y, { height });
    },
  };
}

const label = (pen, str, x, y, width) =>
  pen.text(str.toUpperCase(), x, y, { font: 'semibold', size: 6.8, color: C.muted, spacing: 0.95, width });

function drawTopBar(pen) {
  pen.rect(0, 0, PAGE_W, mm(3), C.red);
  pen.rect(0, mm(3), PAGE_W, mm(0.9), C.gold);
}

function drawHeader(pen, v, compact) {
  const top = PAD_TOP;
  const logoH = compact ? mm(11) : mm(15);
  pen.image(LOGO, LEFT, top, logoH);

  const brandX = LEFT + logoH * LOGO_RATIO + mm(4);
  const brandY = top + logoH / 2 - 12;
  const nameBottom = pen.text(BUSINESS.brandName, brandX, brandY, { font: 'semibold', size: 13 });
  pen.text(BUSINESS.tagline, brandX, nameBottom + 1, { size: 8, color: C.muted });

  const titleSize = compact ? 18 : 30;
  const numberText = compact ? `${v.number} · continued` : v.number;
  const numberY = top + logoH - 11;
  pen.text(numberText, LEFT, numberY, { font: 'semibold', size: 9, color: C.red, width: CONTENT_W, align: 'right', spacing: 0.2 });
  pen.text('Invoice', LEFT, numberY - mm(1.4) - titleSize * 1.12, {
    font: 'light', size: titleSize, width: CONTENT_W, align: 'right', spacing: -titleSize * 0.03,
  });
  return top + logoH + (compact ? mm(5) : 0);
}

function drawIntro(pen, v, y0) {
  // Meta strip: Issued · Payment · Status · Total
  let y = y0 + mm(9);
  pen.rule(LEFT, LEFT + CONTENT_W, y, C.ink, 0.9);
  const gap = mm(4);
  const colW = (CONTENT_W - gap * 3) / 4;
  const cellTop = y + mm(3.2);
  const valueY = label(pen, 'Issued', LEFT, cellTop, colW) + mm(1.3);
  const cells = [
    () => pen.text(v.issuedOn, LEFT, valueY, { font: 'medium', size: 10, width: colW }),
    () => pen.text(v.paymentMethod, LEFT + (colW + gap), valueY, { font: 'medium', size: 10, width: colW }),
    () => {
      const tone = C.tone[v.statusTone];
      const x = LEFT + (colW + gap) * 2;
      const w = pen.width(v.statusLabel, { font: 'semibold', size: 7.6 }) + mm(4.8);
      const h = 7.6 * 1.3 + mm(1);
      pen.rect(x, valueY, w, h, tone.bg, h / 2);
      pen.text(v.statusLabel, x + mm(2.4), valueY + mm(0.5), { font: 'semibold', size: 7.6, color: tone.ink });
      return valueY + h;
    },
    () => pen.text(formatINR(v.total), LEFT + (colW + gap) * 3, valueY, {
      font: 'semibold', size: 10, color: C.red, width: colW, features: NUM,
    }),
  ];
  label(pen, 'Payment', LEFT + (colW + gap), cellTop, colW);
  label(pen, 'Status', LEFT + (colW + gap) * 2, cellTop, colW);
  label(pen, v.totalLabel, LEFT + (colW + gap) * 3, cellTop, colW);
  y = Math.max(...cells.map((draw) => draw())) + mm(3.4);
  pen.rule(LEFT, LEFT + CONTENT_W, y, C.ruleMid, 0.45);

  // Billed to / From
  y += mm(7);
  const partyW = (CONTENT_W - mm(10)) / 2;
  const party = (x, title, name, lines) => {
    let py = label(pen, title, x, y, partyW) + mm(1.3);
    py = pen.text(name, x, py, { font: 'semibold', size: 11, width: partyW }) + mm(1);
    lines.forEach((line) => {
      py = pen.text(line, x, py, { size: 8.8, color: C.body, width: partyW, lineGap: 2 });
    });
    return py;
  };
  const customerLines = [
    ...v.customer.addressLines,
    v.customer.phone && `Phone ${v.customer.phone}`,
    v.customer.email,
  ].filter(Boolean);
  const leftBottom = party(LEFT, 'Billed to', v.customer.name, customerLines);
  const rightBottom = party(LEFT + partyW + mm(10), 'From', BUSINESS.legalName, [
    ...BUSINESS.address,
    `FSSAI Lic. No. ${BUSINESS.fssai}`,
  ]);
  return Math.max(leftBottom, rightBottom) + mm(8);
}

function drawTableHeader(pen, y) {
  label(pen, 'Item', COLS.item.x, y, COLS.item.w);
  pen.text('PRICE', COLS.price.x, y, { font: 'semibold', size: 6.8, color: C.muted, spacing: 0.95, width: COLS.price.w, align: 'right' });
  pen.text('QTY', COLS.qty.x, y, { font: 'semibold', size: 6.8, color: C.muted, spacing: 0.95, width: COLS.qty.w, align: 'right' });
  const bottom = pen.text('AMOUNT', COLS.amount.x, y, { font: 'semibold', size: 6.8, color: C.muted, spacing: 0.95, width: COLS.amount.w, align: 'right' });
  const ruleY = bottom + mm(2.4);
  pen.rule(LEFT, LEFT + CONTENT_W, ruleY, C.ink, 0.9);
  return ruleY + 0.45;
}

function drawRow(pen, line, y) {
  const top = y + mm(3.2);
  let bottom = pen.text(line.name, COLS.item.x, top, { font: 'semibold', size: 10, width: COLS.item.w });
  if (line.size) bottom = pen.text(line.size, COLS.item.x, bottom, { size: 8, color: C.muted, width: COLS.item.w });
  const numY = top + 0.8;
  pen.text(formatINR(line.price), COLS.price.x, numY, { size: 9.4, width: COLS.price.w, align: 'right', features: NUM });
  pen.text(String(line.qty), COLS.qty.x, numY, { size: 9.4, width: COLS.qty.w, align: 'right', features: NUM });
  pen.text(formatINR(line.amount), COLS.amount.x, numY, { font: 'semibold', size: 9.4, width: COLS.amount.w, align: 'right', features: NUM });
  const rowBottom = bottom + mm(3.2);
  pen.rule(LEFT, LEFT + CONTENT_W, rowBottom, C.rule, 0.45);
  return rowBottom;
}

function drawSummary(pen, v, y0) {
  const top = y0 + mm(7);
  const cardW = mm(74);
  const leftW = CONTENT_W - cardW - mm(10);

  // Left: bank and UPI details, amount in words, reference, notes
  let ly = label(pen, 'Bank and UPI details', LEFT, top, leftW) + mm(2);
  const cellW = (leftW - mm(6)) / 2;
  const cell = (x, y, key, value) => {
    const valueY = pen.text(key, x, y, { size: 7.4, color: C.muted, width: cellW });
    return pen.text(value, x, valueY, { font: 'semibold', size: 9.2, width: cellW, features: NUM });
  };
  const row1 = Math.max(cell(LEFT, ly, 'UPI', BUSINESS.upiId), cell(LEFT + cellW + mm(6), ly, 'Bank', BUSINESS.bank.name));
  const row2Top = row1 + mm(3);
  const row2 = Math.max(
    cell(LEFT, row2Top, 'Account no.', BUSINESS.bank.accountNumber),
    cell(LEFT + cellW + mm(6), row2Top, 'IFSC', BUSINESS.bank.ifsc)
  );
  ly = pen.text(v.amountInWords, LEFT, row2 + mm(4), { size: 8.6, color: C.body, width: leftW });
  if (v.paymentRef) ly = pen.text(`Payment reference ${v.paymentRef}`, LEFT, ly + mm(1.2), { size: 7.8, color: C.muted, width: leftW });
  if (v.notes) {
    ly = label(pen, 'Note', LEFT, ly + mm(4), leftW) + mm(1);
    ly = pen.text(v.notes, LEFT, ly, { size: 8.6, color: C.body, width: leftW, lineGap: 1.5 });
  }

  // Right: totals card
  const cardX = LEFT + CONTENT_W - cardW;
  const innerX = cardX + mm(5);
  const innerW = cardW - mm(10);
  const rows = [[v.units ? `Subtotal (${v.units} ${v.units === 1 ? 'pack' : 'packs'})` : 'Subtotal', formatINR(v.subtotal)]];
  if (v.showShipping) rows.push([v.shippingLabel, v.shipping ? formatINR(v.shipping) : 'Free']);
  if (v.discount > 0) rows.push([v.discountLabel, `− ${formatINR(v.discount)}`]);

  const layoutCard = (p) => {
    let ry = top + mm(4.6);
    rows.forEach(([k, val]) => {
      const rowTop = ry + mm(1.1);
      const kb = p.text(k, innerX, rowTop, { size: 9.2, color: C.body, width: innerW * 0.62 });
      const vb = p.text(val, innerX, rowTop, { font: 'semibold', size: 9.2, width: innerW, align: 'right', features: NUM });
      ry = Math.max(kb, vb) + mm(1.1);
    });
    const ruleY = ry + mm(2.4);
    p.rule(innerX, innerX + innerW, ruleY, C.cardRule, 0.6);
    const amountBottom = p.text(formatINR(v.total), innerX, ruleY + mm(3), {
      font: 'semibold', size: 18, color: C.red, width: innerW, align: 'right', features: NUM,
    });
    p.text(v.totalLabel.toUpperCase(), innerX, ruleY + mm(3) + 9.5, { font: 'semibold', size: 7, spacing: 0.98, width: innerW * 0.5 });
    return amountBottom + mm(4.6);
  };
  const cardBottom = layoutCard(createPen(pen.doc, true));
  pen.rect(cardX, top, cardW, cardBottom - top, C.cardBg, mm(3));
  layoutCard(pen);

  const thanksY = Math.max(ly, cardBottom) + mm(9);
  return pen.text(`Thank you for choosing ${BUSINESS.brandName}.`, LEFT, thanksY, { size: 9, color: C.body, width: CONTENT_W });
}

function drawFooter(pen, pageNo, pageCount) {
  pen.rule(LEFT, LEFT + CONTENT_W, FOOTER_TOP, C.rule, 0.45);
  const y = FOOTER_TOP + mm(2.6);
  const style = { size: 7.2, color: C.muted };
  pen.text(`${BUSINESS.legalName} · ${BUSINESS.phone} · ${BUSINESS.email}`, LEFT, y, { ...style, width: CONTENT_W * 0.62 });
  if (pageNo < pageCount) pen.text('Continued on next page', LEFT, y, { ...style, width: CONTENT_W * 0.8, align: 'right' });
  pen.text(`Page ${pageNo} of ${pageCount}`, LEFT, y, { ...style, width: CONTENT_W, align: 'right' });
}

function drawCancelledMark(doc) {
  doc.save();
  doc.rotate(-28, { origin: [PAGE_W / 2, PAGE_H / 2] });
  doc.font('semibold').fontSize(92).fillColor(C.red).fillOpacity(0.08);
  doc.text('CANCELLED', 0, PAGE_H / 2 - 50, { width: PAGE_W, align: 'center', lineBreak: false });
  doc.restore();
}

// Greedy pagination; when the totals don't fit under the last rows, the final
// row moves with them so the totals never sit on a page with no items.
function planPages({ firstCapacity, nextCapacity, rowHeights, summaryHeight }) {
  const pages = [];
  let page = { start: 0, end: 0 };
  let used = 0;
  let capacity = firstCapacity;
  rowHeights.forEach((height, i) => {
    if (page.end > page.start && used + height > capacity) {
      pages.push(page);
      page = { start: i, end: i };
      used = 0;
      capacity = nextCapacity;
    }
    page.end = i + 1;
    used += height;
  });
  if (used + summaryHeight > capacity) {
    if (page.end - page.start > 1) {
      pages.push({ start: page.start, end: page.end - 1 });
      page = { start: page.end - 1, end: page.end };
    } else {
      pages.push(page);
      page = { start: page.end, end: page.end };
    }
  }
  pages.push(page);
  return pages;
}

/**
 * @param {object} v invoice view model from invoiceService.presentInvoice()
 * @returns {Promise<Buffer>}
 */
function renderInvoicePdf(v) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: { Title: `Invoice ${v.number}`, Author: BUSINESS.legalName, Subject: `Invoice ${v.number}` },
    });
    Object.entries(FONTS).forEach(([name, file]) => doc.registerFont(name, file));

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const dry = createPen(doc, true);
      const firstRowsTop = drawTableHeader(dry, drawIntro(dry, v, drawHeader(dry, v, false)));
      const nextHeaderBottom = drawHeader(dry, v, true);
      const nextRowsTop = drawTableHeader(dry, nextHeaderBottom);
      const rowHeights = v.lines.map((line) => drawRow(dry, line, 0));
      const summaryHeight = drawSummary(dry, v, 0);
      const pages = planPages({
        firstCapacity: CONTENT_LIMIT - firstRowsTop,
        nextCapacity: CONTENT_LIMIT - nextRowsTop,
        rowHeights,
        summaryHeight,
      });

      const pen = createPen(doc, false);
      pages.forEach((page, i) => {
        if (i > 0) doc.addPage({ size: 'A4', margin: 0 });
        if (v.cancelled) drawCancelledMark(doc);
        drawTopBar(pen);
        let y = i === 0 ? drawIntro(pen, v, drawHeader(pen, v, false)) : drawHeader(pen, v, true);
        if (page.end > page.start) {
          y = drawTableHeader(pen, y);
          v.lines.slice(page.start, page.end).forEach((line) => { y = drawRow(pen, line, y); });
        }
        if (i === pages.length - 1) drawSummary(pen, v, y);
      });

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i += 1) {
        doc.switchToPage(range.start + i);
        drawFooter(pen, i + 1, range.count);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { renderInvoicePdf, planPages };
