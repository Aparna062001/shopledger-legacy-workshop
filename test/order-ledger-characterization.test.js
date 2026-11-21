'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

test('order history sorts newest calendar date first', function () {
  const db = {
    orders: [
      { id: 1, date: '02/01/2025' },
      { id: 2, date: '30/12/2024' },
      { id: 3, date: '10/06/2024' }
    ]
  };

  assert.deepEqual(orders.list(db).map(function (order) {
    return order.id;
  }), [1, 2, 3]);
});

test('order history date range includes only orders within the selected dates', function () {
  const db = {
    orders: [
      { id: 1, date: '30/11/2024' },
      { id: 2, date: '15/12/2024' },
      { id: 3, date: '02/01/2025' }
    ]
  };

  const result = orders.list(db, {
    from: '2024-12-01',
    to: '2024-12-31'
  });

  assert.deepEqual(result.map(function (order) {
    return order.id;
  }).sort(), [2]);
});

test('Khata settlement treats a string amount as a number when updating balance', function () {
  const db = {
    nextSettlementId: 8,
    customers: [{
      id: 5,
      name: 'Asha',
      openingBalance: 0,
      totalBilled: 100,
      totalSettled: 10
    }],
    settlements: []
  };

  const result = ledger.recordSettlement(db, 5, '25', 'cash', 'Counter payment');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 35);
  assert.equal(db.customers[0].balance, 65);
  assert.equal(result.settlement.amount, 25);
});
