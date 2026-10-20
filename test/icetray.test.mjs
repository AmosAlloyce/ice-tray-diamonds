import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandaloneApp } from '../server/index.mjs';

test('Ice Tray Diamonds Full-Stack REST API & SQLite WAL Database Suite', async (t) => {
  const app = createStandaloneApp({ dbPath: ':memory:' });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  t.after(() => {
    server.close();
    app.locals.close();
  });

  await t.test('GET /health returns SQLite WAL status and 6 available editions', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.storage, 'sqlite-wal');
    assert.equal(body.totalCarats, 24.8);
    assert.equal(body.totalComponents, 384);
    assert.equal(body.availableEditions, 6);
  });

  await t.test('GET /suite returns all 5 jewelry pieces, 8 GIA parcels, and 10 editions', async () => {
    const res = await fetch(`${baseUrl}/suite`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.pieces.length, 5);
    assert.equal(body.editions.length, 10);
    assert.equal(body.certificates.length, 8);
    assert.equal(body.pieces[0].slug, 'glacial-tennis-bracelet');
  });

  await t.test('POST /configure/quote calculates dynamic metallurgy & Type IIa D-Flawless valuation', async () => {
    const res = await fetch(`${baseUrl}/configure/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'FULL_SUITE',
        metalAlloy: 'AU750_OBS',
        diamondTier: 'D_FL',
        wristSizeMm: 175,
        engravingText: 'ATELIER GENEVE',
        destination: 'NEW_YORK',
      }),
    });
    assert.equal(res.status, 200);
    const { quote } = await res.json();
    assert.equal(quote.breakdown.basePriceUsd, 48500);
    assert.equal(quote.breakdown.alloyDeltaUsd, 2200);
    assert.equal(quote.breakdown.diamondDeltaUsd, 9800);
    assert.equal(quote.breakdown.engravingFeeUsd, 350);
    assert.ok(quote.breakdown.totalValuationUsd > 61000);
  });

  await t.test('POST /editions/:num/hold enforces concurrency-safe session locks', async () => {
    // Session A holds Edition 4
    const holdA = await fetch(`${baseUrl}/editions/4/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-atelier-session': 'session-alpha',
      },
    });
    assert.equal(holdA.status, 200);
    const bodyA = await holdA.json();
    assert.equal(bodyA.edition.status, 'HELD');

    // Session B attempts to hold Edition 4 -> 409 Conflict
    const holdB = await fetch(`${baseUrl}/editions/4/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-atelier-session': 'session-beta',
      },
    });
    assert.equal(holdB.status, 409);
  });

  await t.test('POST /reservations creates persistent Vault Pass & marks edition ACQUIRED', async () => {
    const res = await fetch(`${baseUrl}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-atelier-session': 'session-alpha',
      },
      body: JSON.stringify({
        editionNumber: 4,
        clientName: 'Duchess Clara von Habsburg',
        clientEmail: 'clara@habsburg-office.at',
        scope: 'FULL_SUITE',
        metalAlloy: 'PT950',
        diamondTier: 'D_FL',
        ringSize: 'EU 52 (US 6)',
        wristSizeMm: 165,
        engravingText: 'SEMPER FIDELIS',
        destination: 'GENEVA',
        dispatchMethod: 'SALON_HANDOVER',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.reservation.referenceCode.startsWith('ITD-2026-04'));
    assert.equal(body.reservation.status, 'CONFIRMED_VAULT');

    // Verify lookup endpoint works for the newly created dossier
    const lookup = await fetch(`${baseUrl}/reservations/${body.reservation.referenceCode}`);
    assert.equal(lookup.status, 200);
    const lookupBody = await lookup.json();
    assert.equal(lookupBody.reservation.clientName, 'Duchess Clara von Habsburg');
  });
});
