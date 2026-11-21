'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('inventory allows selling exactly the last sellable unit', function () {
  const products = [{ id: 1, name: 'Rice', stock: 1, reserved: 0 }];
  const items = [{ id: 1, qty: 1 }];

  assert.deepEqual(inventory.check(products, items), { ok: true });
});

test('cancelling an order restores deducted stock', function () {
  const db = {
    products: [{ id: 1, name: 'Rice', stock: 4, reserved: 0 }],
    orders: [{
      id: 1001,
      status: 'completed',
      paymentMode: 'cash',
      total: 10,
      items: [{ id: 1, qty: 1 }]
    }]
  };

  const result = orders.cancel(db, 1001, 'Test cancellation');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[0].reserved, 0);
});
