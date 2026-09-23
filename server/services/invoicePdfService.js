// server/services/invoicePdfService.js
//
// Renders Invoice/CreditNote documents as PDF (pdfkit) purely from the
// stored, immutable snapshot — never re-reads live catalog/account data
// (spec §12). No GST/HSN anywhere: title is plain "INVOICE"/"CREDIT
// NOTE" (never "Tax Invoice"), the FSSAI number is prominent, and the
// supplier's not-registered-under-GST note is always printed.
//
// Note on testing: pdfkit embeds/subsets even the standard 14 fonts, so
// a rendered PDF's text never appears as greppable literal ASCII in the
// byte stream (confirmed directly — compression was not the obstacle).
// Extracting real text back out would need a PDF-parsing dependency
// beyond the two this phase is scoped to (pdfkit, mongodb-memory-server),
// so tests/b2bInvoicing.test.js instead asserts correctness on the
// Invoice document's stored fields (the actual source of truth this
// file only transcribes) plus a render-succeeds smoke test; the visual
// layout was additionally confirmed once by hand.

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const BRAND_BROWN = '#2d1a00';
const BRAND_SAFFRON = '#e07000';
const MUTED = '#7a3300';

const LOGO_PATH = path.join(__dirname, '../../client/public/images/logo.png');

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

function drawHeader(doc, title, docNumber, issuedAt) {
  let logoDrawn = false;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 40, 36, { width: 56 });
      logoDrawn = true;
    }
  } catch { /* logo optional — fall back to text-only header */ }

  const textX = logoDrawn ? 106 : 40;
  doc.fillColor(BRAND_BROWN).fontSize(16).font('Helvetica-Bold').text('NAMDEV CHIWDA', textX, 40);
  doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('Since 1873 - Solapur, Maharashtra', textX, 60);

  doc.fillColor(BRAND_SAFFRON).fontSize(20).font('Helvetica-Bold').text(title.toUpperCase(), 340, 40, { width: 215, align: 'right' });
  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica').text(`No: ${docNumber}`, 340, 66, { width: 215, align: 'right' });
  doc.text(`Date: ${formatDate(issuedAt)}`, 340, 80, { width: 215, align: 'right' });

  doc.moveTo(40, 106).lineTo(555, 106).strokeColor('#e5d5b8').stroke();
}

function drawSellerBlock(doc, seller, y) {
  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('FROM', 40, y);
  doc.font('Helvetica').fontSize(9).fillColor('#3a2a10');
  const lines = [
    seller.legalName || seller.tradeName,
    [seller.address?.line1, seller.address?.line2].filter(Boolean).join(', '),
    [seller.address?.city, seller.address?.pincode].filter(Boolean).join(' - '),
    seller.phone ? `Phone: ${seller.phone}` : null,
    seller.email ? `Email: ${seller.email}` : null,
  ].filter(Boolean);
  doc.text(lines.join('\n'), 40, y + 14, { width: 250 });

  // FSSAI number — prominent, per spec §6.11.
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_SAFFRON)
    .text(`FSSAI Lic. No.: ${seller.fssaiLicenseNo || '-'}`, 40, y + 14 + lines.length * 12 + 6);
}

function drawBuyerBlock(doc, buyer, shipTo, y) {
  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('BILL TO', 310, y);
  doc.font('Helvetica').fontSize(9).fillColor('#3a2a10');
  const billLines = [
    buyer.businessName,
    buyer.gstin ? `GSTIN: ${buyer.gstin}` : null,
    [buyer.address?.line1, buyer.address?.line2].filter(Boolean).join(', '),
    [buyer.address?.city, buyer.address?.pincode].filter(Boolean).join(' - '),
  ].filter(Boolean);
  doc.text(billLines.join('\n'), 310, y + 14, { width: 245 });

  if (shipTo) {
    const shipY = y + 14 + billLines.length * 12 + 10;
    doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('SHIP TO', 310, shipY);
    doc.font('Helvetica').fontSize(9).fillColor('#3a2a10');
    const shipLines = [
      shipTo.contactName,
      [shipTo.line1, shipTo.line2].filter(Boolean).join(', '),
      [shipTo.city, shipTo.pincode].filter(Boolean).join(' - '),
    ].filter(Boolean);
    doc.text(shipLines.join('\n'), 310, shipY + 14, { width: 245 });
  }
}

function drawMeta(doc, { dueDate, orderNumber, advanceNote }, y) {
  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('Order:', 40, y).font('Helvetica').text(orderNumber || '-', 100, y);
  doc.font('Helvetica-Bold').text('Advance:', 40, y + 14).font('Helvetica').text(advanceNote || '-', 100, y + 14);
  doc.font('Helvetica-Bold').text('Due date:', 40, y + 28).font('Helvetica').text(formatDate(dueDate), 100, y + 28);
}

function drawLinesTable(doc, lines, y) {
  const colX = { sno: 40, desc: 70, cases: 300, units: 350, rate: 400, amount: 470 };
  doc.rect(40, y, 515, 20).fill('#fef3e0');
  doc.fillColor(BRAND_BROWN).fontSize(8).font('Helvetica-Bold');
  doc.text('S.No', colX.sno, y + 6, { width: 25 });
  doc.text('Description', colX.desc, y + 6, { width: 225 });
  doc.text('Cases', colX.cases, y + 6, { width: 45, align: 'right' });
  doc.text('Units', colX.units, y + 6, { width: 45, align: 'right' });
  doc.text('Rate/unit', colX.rate, y + 6, { width: 65, align: 'right' });
  doc.text('Amount', colX.amount, y + 6, { width: 80, align: 'right' });

  let rowY = y + 24;
  doc.font('Helvetica').fontSize(8.5).fillColor('#3a2a10');
  for (const line of lines) {
    doc.text(String(line.serialNo), colX.sno, rowY, { width: 25 });
    doc.text(line.description, colX.desc, rowY, { width: 225 });
    doc.text(String(line.cases), colX.cases, rowY, { width: 45, align: 'right' });
    doc.text(String(line.units), colX.units, rowY, { width: 45, align: 'right' });
    doc.text(money(line.unitPrice), colX.rate, rowY, { width: 65, align: 'right' });
    doc.text(money(line.lineTotal), colX.amount, rowY, { width: 80, align: 'right' });
    rowY += 18;
  }
  doc.moveTo(40, rowY + 2).lineTo(555, rowY + 2).strokeColor('#e5d5b8').stroke();
  return rowY + 12;
}

function drawTotals(doc, totals, amountInWords, y) {
  const labelX = 380, valueX = 470;
  doc.font('Helvetica').fontSize(9).fillColor('#3a2a10');
  doc.text('Subtotal', labelX, y, { width: 80 }).text(money(totals.subtotal), valueX, y, { width: 80, align: 'right' });
  if (totals.roundOff) {
    doc.text('Round off', labelX, y + 14, { width: 80 }).text(money(totals.roundOff), valueX, y + 14, { width: 80, align: 'right' });
  }
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND_SAFFRON)
    .text('Total payable', labelX, y + 30, { width: 80 })
    .text(money(totals.payable), valueX, y + 30, { width: 80, align: 'right' });

  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED)
    .text(amountInWords, 40, y + 30, { width: 320 });

  return y + 56;
}

function drawBankDetails(doc, bank, y) {
  if (!bank || !(bank.bankName || bank.upiId)) return y;
  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('PAYMENT DETAILS', 40, y);
  doc.font('Helvetica').fontSize(8.5).fillColor('#3a2a10');
  const lines = [
    bank.bankName ? `Bank: ${bank.bankName}` : null,
    bank.accountName ? `Account name: ${bank.accountName}` : null,
    bank.accountNo ? `Account no.: ${bank.accountNo}` : null,
    bank.ifsc ? `IFSC: ${bank.ifsc}` : null,
    bank.upiId ? `UPI: ${bank.upiId}` : null,
  ].filter(Boolean);
  doc.text(lines.join('   |   '), 40, y + 14, { width: 515 });
  return y + 32;
}

function drawFooter(doc, supplierTaxNote, y) {
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5d5b8').stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND_BROWN).text(supplierTaxNote, 40, y + 10, { width: 515, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('This is a computer-generated document.', 40, y + 24, { width: 515, align: 'center' });
}

/**
 * @param {import('mongoose').Document} invoice
 * @param {{ orderNumber?: string }} [extra]
 */
function renderInvoicePdf(invoice, extra = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  drawHeader(doc, invoice.documentTitle, invoice.invoiceNumber, invoice.issuedAt);
  drawSellerBlock(doc, invoice.seller, 120);
  drawBuyerBlock(doc, invoice.buyer, invoice.shipTo, 120);
  drawMeta(doc, { dueDate: invoice.dueDate, orderNumber: extra.orderNumber, advanceNote: extra.advanceNote }, 220);
  const afterTable = drawLinesTable(doc, invoice.lines, 258);
  const afterTotals = drawTotals(doc, invoice.totals, invoice.amountInWords, afterTable + 8);
  const afterBank = drawBankDetails(doc, invoice.seller.bank, afterTotals + 10);
  drawFooter(doc, invoice.supplierTaxNote, Math.max(afterBank + 20, 700));

  doc.end();
  return doc;
}

/**
 * @param {import('mongoose').Document} creditNote
 * @param {import('mongoose').Document} invoice - the original invoice being credited
 */
function renderCreditNotePdf(creditNote, invoice) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  drawHeader(doc, creditNote.documentTitle, creditNote.creditNoteNumber, creditNote.issuedAt);
  drawSellerBlock(doc, invoice.seller, 120);
  drawBuyerBlock(doc, invoice.buyer, invoice.shipTo, 120);

  doc.fillColor(BRAND_BROWN).fontSize(9).font('Helvetica-Bold').text('Against invoice:', 40, 220)
    .font('Helvetica').text(`${invoice.invoiceNumber} dated ${formatDate(invoice.issuedAt)}`, 130, 220);
  doc.font('Helvetica-Bold').text('Reason:', 40, 234).font('Helvetica').text(creditNote.reason, 130, 234, { width: 425 });

  const afterTable = drawLinesTable(doc, invoice.lines, 270);
  const afterTotals = drawTotals(doc, creditNote.totals, invoice.amountInWords, afterTable + 8);
  drawFooter(doc, invoice.supplierTaxNote, Math.max(afterTotals + 20, 700));

  doc.end();
  return doc;
}

module.exports = { renderInvoicePdf, renderCreditNotePdf };
