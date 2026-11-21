'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function riceOrder(coupon) {
  const items = [{
    id: 1,
    sku: 'GRN-001',
    name: 'Rice',
    hsn: '1006',
    price: 1000,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, coupon || '');

  return {
    items,
    coupon: coupon || '',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total,
    billed
  };
}

test('invoice uses the billed HSN GST rate when there is no coupon', function () {
  const order = riceOrder('');
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: order.billed.subtotal,
      tax: order.billed.tax,
      cgst: order.billed.cgst,
      sgst: order.billed.sgst,
      total: order.billed.total
    },
    { subtotal: 1000, tax: 50, cgst: 25, sgst: 25, total: 1050 }
  );
  assert.deepEqual(
    {
      gstPercent: figures.rows[0].gstPercent,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    { gstPercent: 5, tax: 50, cgst: 25, sgst: 25, total: 1050 }
  );
});

test('invoice applies the billed coupon before HSN GST', function () {
  const order = riceOrder('WELCOME');
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: order.billed.subtotal,
      discount: order.billed.discount,
      tax: order.billed.tax,
      cgst: order.billed.cgst,
      sgst: order.billed.sgst,
      total: order.billed.total
    },
    { subtotal: 1000, discount: 50, tax: 47.5, cgst: 23.75, sgst: 23.75, total: 997.5 }
  );
  assert.deepEqual(
    {
      discount: figures.discount,
      lineDiscount: figures.rows[0].lineDiscount,
      taxable: figures.rows[0].taxable,
      lineTax: figures.rows[0].lineTax,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    { discount: 50, lineDiscount: 50, taxable: 950, lineTax: 47.5, tax: 47.5, cgst: 23.75, sgst: 23.75, total: 997.5 }
  );
});

test('invoice matches billed figures for the reproducible rice WELCOME order', function () {
  const items = [{
    id: 1,
    sku: 'GRN-001',
    name: 'Indrayani Basmati Rice 5kg',
    hsn: '1006',
    price: 640,
    qty: 1
  }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const figures = invoice.computeInvoiceFigures({
    items,
    coupon: 'WELCOME',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    }
  );
  assert.deepEqual(
    {
      gstPercent: figures.rows[0].gstPercent,
      lineDiscount: figures.rows[0].lineDiscount,
      taxable: figures.rows[0].taxable,
      lineTax: figures.rows[0].lineTax
    },
    { gstPercent: 5, lineDiscount: 32, taxable: 608, lineTax: 30.4 }
  );
});
