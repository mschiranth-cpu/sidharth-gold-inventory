/**
 * One-time migration: backfill payment fields on legacy non-billable
 * PURCHASE rows so they don't suddenly appear as "outstanding" after
 * the refactor that made non-billable purchases affect vendor balance.
 *
 * Pre-refactor, non-billable rows were never tracked against vendor
 * outstanding, so users implicitly considered them "fully settled".
 * Post-refactor, the same rows would show full totalValue as due.
 *
 * Strategy:
 *   - Find PURCHASE rows where paymentStatus IS NULL (no payment cache).
 *   - Mark them as COMPLETE with amountPaid = totalValue, paymentMode = 'CASH'.
 *   - Skip rows where amountPaid is already set (already tracked).
 *   - Vendor creditBalance is NOT touched (legacy rows had no credit deltas).
 *
 * Run with:
 *   cd backend && npx ts-node scripts/backfill-legacy-nonbillable.ts
 *   # or with --dry-run to preview without writing
 *   cd backend && npx ts-node scripts/backfill-legacy-nonbillable.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function backfill() {
  console.log(
    dryRun
      ? '🔍 DRY RUN — no rows will be modified\n'
      : '🚀 Backfilling legacy non-billable PURCHASE rows…\n'
  );

  const candidates = await prisma.metalTransaction.findMany({
    where: {
      transactionType: 'PURCHASE',
      paymentStatus: null,
    },
    select: {
      id: true,
      isBillable: true,
      totalValue: true,
      amountPaid: true,
      vendor: { select: { name: true, uniqueCode: true } },
      createdAt: true,
    },
  });

  console.log(`Found ${candidates.length} PURCHASE rows with no payment status.\n`);

  let billablePending = 0;
  let nonBillableLegacy = 0;
  let updated = 0;

  for (const row of candidates) {
    const totalValue = row.totalValue ?? 0;
    if (totalValue <= 0) continue;

    if (row.isBillable === true) {
      // Genuinely billable but never settled — leave alone.
      billablePending++;
      continue;
    }

    nonBillableLegacy++;

    const vendorLabel = row.vendor
      ? `${row.vendor.name} (${row.vendor.uniqueCode})`
      : 'no vendor';
    const created = row.createdAt.toISOString().split('T')[0];

    console.log(
      `  • ${row.id.slice(0, 8)}… ${vendorLabel} — ₹${totalValue.toFixed(2)} on ${created}`
    );

    if (!dryRun) {
      await prisma.metalTransaction.update({
        where: { id: row.id },
        data: {
          paymentStatus: 'COMPLETE',
          paymentMode: 'CASH',
          amountPaid: totalValue,
        },
      });
      updated++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Billable rows left untouched (still pending):       ${billablePending}`);
  console.log(`Legacy non-billable rows ${dryRun ? 'would be' : ''} backfilled: ${nonBillableLegacy}`);
  if (!dryRun) console.log(`Rows actually updated:                              ${updated}`);

  await prisma.$disconnect();
}

backfill().catch((err) => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
