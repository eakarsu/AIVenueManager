const test = require('node:test'); const assert = require('node:assert/strict'); const p = require('../domain/fulfillmentWorkflow');
test('ticket inventory is explicit', () => assert.throws(() => p.validateOrder({ eventId: 'e', venueId: 'v', tickets: [{}] }), /inventory/));
test('integer-cent ticket pricing works', () => assert.equal(p.validateOrder({ eventId: 'e', venueId: 'v', tickets: [{ inventoryKey: 's1', priceCents: 10 }] }), true));
test('invalid jump fails', () => assert.throws(() => p.transition({ status: 'draft', version: 1 }, 'paid'), /invalid/));
test('allocation needs ticketing receipt', () => assert.throws(() => p.transition({ status: 'paid', version: 1 }, 'allocated'), /ticketing/));
test('refund is bounded', () => assert.throws(() => p.transition({ status: 'refund_pending', version: 1, paidCents: 10 }, 'refunded', { refundReceipt: 'r', refundCents: 11 }), /bounded/));
test('ticketing timeout can dead-letter', () => assert.equal(p.acceptDelivery({ provider: 'ticketing', idempotencyKey: 'k', status: 'dead_letter' }), true));
test('customer subject is isolated',()=>assert.equal(p.assertScope({tenantId:'t',subjectId:'s'},{tenantId:'t',subjectId:'s',role:'customer'},['staff']),true));
test('other customer is hidden',()=>assert.throws(()=>p.assertScope({tenantId:'t',subjectId:'s'},{tenantId:'t',subjectId:'x',role:'customer'},['staff']),/subject/));
