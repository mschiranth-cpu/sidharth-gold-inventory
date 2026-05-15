/**
 * Idempotent seed for the diamond `sieve_sizes` master table.
 *
 * Source of truth for the two charts captured in
 * `plans/loose-diamond-credit-and-sieve-flow.md` (Phase 0):
 *   1. Sieve mesh chart (33 MESH rows, +000/-00 … +15.5/-16)
 *   2. Size-by-carats chart (8 SINGLE rows, 0.20Ct … 0.80Ct)
 *
 * Behaviour: upsert by `code` so re-running this seed (or the main
 * `seed.ts`) never duplicates rows AND keeps any active flag flips by the
 * operator intact when re-applying — only the source-of-truth fields below
 * are overwritten on conflict. The matching production SQL patch
 * (`sql-patches/2026-05-15_add_sieve_sizes.sql`) was used as a one-shot to
 * bootstrap prod; this file is the canonical seed used by `npm run seed`
 * for fresh dev DBs and is the only place to add / amend chart rows going
 * forward.
 */

import { PrismaClient, Prisma } from '@prisma/client';

interface MeshRow {
  code: string;
  sieveCodeFrom: string;
  sieveCodeTo: string;
  piecesPerCaratAvg: number;
  weightPerPieceCt: number;
  mmFrom: number;
  mmTo: number;
  displayOrder: number;
}

interface SingleRow {
  code: string;
  sizeLabel: string;
  weightPerPieceCt: number;
  mmFrom: number;
  mmTo: number;
  displayOrder: number;
}

const MESH_ROWS: MeshRow[] = [
  { code: '+000/-00', sieveCodeFrom: '+000', sieveCodeTo: '-00', piecesPerCaratAvg: 215, weightPerPieceCt: 0.004, mmFrom: 0.9, mmTo: 1.0, displayOrder: 1 },
  { code: '+00/-0', sieveCodeFrom: '+00', sieveCodeTo: '-0', piecesPerCaratAvg: 200, weightPerPieceCt: 0.005, mmFrom: 1.0, mmTo: 1.1, displayOrder: 2 },
  { code: '+0/-1', sieveCodeFrom: '+0', sieveCodeTo: '-1', piecesPerCaratAvg: 175, weightPerPieceCt: 0.006, mmFrom: 1.1, mmTo: 1.15, displayOrder: 3 },
  { code: '+1/-1.5', sieveCodeFrom: '+1', sieveCodeTo: '-1.5', piecesPerCaratAvg: 150, weightPerPieceCt: 0.007, mmFrom: 1.15, mmTo: 1.2, displayOrder: 4 },
  { code: '+1.5/-2', sieveCodeFrom: '+1.5', sieveCodeTo: '-2', piecesPerCaratAvg: 120, weightPerPieceCt: 0.008, mmFrom: 1.2, mmTo: 1.25, displayOrder: 5 },
  { code: '+2/-2.5', sieveCodeFrom: '+2', sieveCodeTo: '-2.5', piecesPerCaratAvg: 110, weightPerPieceCt: 0.009, mmFrom: 1.25, mmTo: 1.3, displayOrder: 6 },
  { code: '+2.5/-3', sieveCodeFrom: '+2.5', sieveCodeTo: '-3', piecesPerCaratAvg: 110, weightPerPieceCt: 0.01, mmFrom: 1.3, mmTo: 1.35, displayOrder: 7 },
  { code: '+3/-3.5', sieveCodeFrom: '+3', sieveCodeTo: '-3.5', piecesPerCaratAvg: 110, weightPerPieceCt: 0.011, mmFrom: 1.35, mmTo: 1.4, displayOrder: 8 },
  { code: '+3.5/-4', sieveCodeFrom: '+3.5', sieveCodeTo: '-4', piecesPerCaratAvg: 80, weightPerPieceCt: 0.012, mmFrom: 1.4, mmTo: 1.45, displayOrder: 9 },
  { code: '+4/-4.5', sieveCodeFrom: '+4', sieveCodeTo: '-4.5', piecesPerCaratAvg: 80, weightPerPieceCt: 0.013, mmFrom: 1.45, mmTo: 1.5, displayOrder: 10 },
  { code: '+4.5/-5', sieveCodeFrom: '+4.5', sieveCodeTo: '-5', piecesPerCaratAvg: 70, weightPerPieceCt: 0.014, mmFrom: 1.5, mmTo: 1.55, displayOrder: 11 },
  { code: '+5/-5.5', sieveCodeFrom: '+5', sieveCodeTo: '-5.5', piecesPerCaratAvg: 60, weightPerPieceCt: 0.016, mmFrom: 1.55, mmTo: 1.6, displayOrder: 12 },
  { code: '+5.5/-6', sieveCodeFrom: '+5.5', sieveCodeTo: '-6', piecesPerCaratAvg: 50, weightPerPieceCt: 0.018, mmFrom: 1.6, mmTo: 1.7, displayOrder: 13 },
  { code: '+6/-6.5', sieveCodeFrom: '+6', sieveCodeTo: '-6.5', piecesPerCaratAvg: 50, weightPerPieceCt: 0.021, mmFrom: 1.7, mmTo: 1.8, displayOrder: 14 },
  { code: '+6.5/-7', sieveCodeFrom: '+6.5', sieveCodeTo: '-7', piecesPerCaratAvg: 40, weightPerPieceCt: 0.025, mmFrom: 1.8, mmTo: 1.9, displayOrder: 15 },
  { code: '+7/-7.5', sieveCodeFrom: '+7', sieveCodeTo: '-7.5', piecesPerCaratAvg: 30, weightPerPieceCt: 0.029, mmFrom: 1.9, mmTo: 2.0, displayOrder: 16 },
  { code: '+7.5/-8', sieveCodeFrom: '+7.5', sieveCodeTo: '-8', piecesPerCaratAvg: 30, weightPerPieceCt: 0.035, mmFrom: 2.0, mmTo: 2.1, displayOrder: 17 },
  { code: '+8/-8.5', sieveCodeFrom: '+8', sieveCodeTo: '-8.5', piecesPerCaratAvg: 25, weightPerPieceCt: 0.039, mmFrom: 2.1, mmTo: 2.2, displayOrder: 18 },
  { code: '+8.5/-9', sieveCodeFrom: '+8.5', sieveCodeTo: '-9', piecesPerCaratAvg: 25, weightPerPieceCt: 0.044, mmFrom: 2.2, mmTo: 2.3, displayOrder: 19 },
  { code: '+9/-9.5', sieveCodeFrom: '+9', sieveCodeTo: '-9.5', piecesPerCaratAvg: 20, weightPerPieceCt: 0.052, mmFrom: 2.3, mmTo: 2.4, displayOrder: 20 },
  { code: '+9.5/-10', sieveCodeFrom: '+9.5', sieveCodeTo: '-10', piecesPerCaratAvg: 20, weightPerPieceCt: 0.058, mmFrom: 2.4, mmTo: 2.5, displayOrder: 21 },
  { code: '+10/-10.5', sieveCodeFrom: '+10', sieveCodeTo: '-10.5', piecesPerCaratAvg: 15, weightPerPieceCt: 0.069, mmFrom: 2.5, mmTo: 2.6, displayOrder: 22 },
  { code: '+10.5/-11', sieveCodeFrom: '+10.5', sieveCodeTo: '-11', piecesPerCaratAvg: 15, weightPerPieceCt: 0.074, mmFrom: 2.6, mmTo: 2.7, displayOrder: 23 },
  { code: '+11/-11.5', sieveCodeFrom: '+11', sieveCodeTo: '-11.5', piecesPerCaratAvg: 12, weightPerPieceCt: 0.078, mmFrom: 2.7, mmTo: 2.8, displayOrder: 24 },
  { code: '+11.5/-12', sieveCodeFrom: '+11.5', sieveCodeTo: '-12', piecesPerCaratAvg: 12, weightPerPieceCt: 0.086, mmFrom: 2.8, mmTo: 2.9, displayOrder: 25 },
  { code: '+12/-12.5', sieveCodeFrom: '+12', sieveCodeTo: '-12.5', piecesPerCaratAvg: 10, weightPerPieceCt: 0.095, mmFrom: 2.9, mmTo: 3.0, displayOrder: 26 },
  { code: '+12.5/-13', sieveCodeFrom: '+12.5', sieveCodeTo: '-13', piecesPerCaratAvg: 10, weightPerPieceCt: 0.108, mmFrom: 3.0, mmTo: 3.1, displayOrder: 27 },
  { code: '+13/-13.5', sieveCodeFrom: '+13', sieveCodeTo: '-13.5', piecesPerCaratAvg: 8, weightPerPieceCt: 0.116, mmFrom: 3.1, mmTo: 3.2, displayOrder: 28 },
  { code: '+13.5/-14', sieveCodeFrom: '+13.5', sieveCodeTo: '-14', piecesPerCaratAvg: 8, weightPerPieceCt: 0.125, mmFrom: 3.2, mmTo: 3.3, displayOrder: 29 },
  { code: '+14/-14.5', sieveCodeFrom: '+14', sieveCodeTo: '-14.5', piecesPerCaratAvg: 7, weightPerPieceCt: 0.135, mmFrom: 3.3, mmTo: 3.4, displayOrder: 30 },
  { code: '+14.5/-15', sieveCodeFrom: '+14.5', sieveCodeTo: '-15', piecesPerCaratAvg: 7, weightPerPieceCt: 0.146, mmFrom: 3.4, mmTo: 3.5, displayOrder: 31 },
  { code: '+15/-15.5', sieveCodeFrom: '+15', sieveCodeTo: '-15.5', piecesPerCaratAvg: 6, weightPerPieceCt: 0.159, mmFrom: 3.5, mmTo: 3.6, displayOrder: 32 },
  { code: '+15.5/-16', sieveCodeFrom: '+15.5', sieveCodeTo: '-16', piecesPerCaratAvg: 6, weightPerPieceCt: 0.175, mmFrom: 3.6, mmTo: 3.7, displayOrder: 33 },
];

const SINGLE_ROWS: SingleRow[] = [
  { code: '0.20Ct', sizeLabel: '0.20 Cts', weightPerPieceCt: 0.2, mmFrom: 3.6, mmTo: 3.8, displayOrder: 101 },
  { code: '0.25Ct', sizeLabel: '0.25 Cts', weightPerPieceCt: 0.25, mmFrom: 3.8, mmTo: 4.2, displayOrder: 102 },
  { code: '0.30Ct', sizeLabel: '0.30 Cts', weightPerPieceCt: 0.3, mmFrom: 4.2, mmTo: 4.6, displayOrder: 103 },
  { code: '0.40Ct', sizeLabel: '0.40 Cts', weightPerPieceCt: 0.4, mmFrom: 4.6, mmTo: 5.0, displayOrder: 104 },
  { code: '0.50Ct', sizeLabel: '0.50 Cts', weightPerPieceCt: 0.5, mmFrom: 5.0, mmTo: 5.3, displayOrder: 105 },
  { code: '0.60Ct', sizeLabel: '0.60 Cts', weightPerPieceCt: 0.6, mmFrom: 5.3, mmTo: 5.6, displayOrder: 106 },
  { code: '0.70Ct', sizeLabel: '0.70 Cts', weightPerPieceCt: 0.7, mmFrom: 5.6, mmTo: 5.9, displayOrder: 107 },
  { code: '0.80Ct', sizeLabel: '0.80 Cts', weightPerPieceCt: 0.8, mmFrom: 5.9, mmTo: 6.1, displayOrder: 108 },
];

/**
 * Upsert all sieve master rows. Re-runs are safe — `code` is unique and the
 * upsert overwrites the data fields but keeps the auto-generated `id` (and
 * therefore any FKs from `diamonds` / `diamond_transactions` /
 * `diamond_purchase_order_lines` that already point at the row).
 */
export async function seedSieveSizes(prisma: PrismaClient): Promise<{ mesh: number; single: number }> {
  let mesh = 0;
  let single = 0;

  for (const r of MESH_ROWS) {
    const data: Prisma.SieveSizeCreateInput = {
      kind: 'MESH',
      code: r.code,
      sieveCodeFrom: r.sieveCodeFrom,
      sieveCodeTo: r.sieveCodeTo,
      piecesPerCaratAvg: r.piecesPerCaratAvg,
      weightPerPieceCt: r.weightPerPieceCt,
      mmFrom: r.mmFrom,
      mmTo: r.mmTo,
      displayOrder: r.displayOrder,
      isActive: true,
    };
    await prisma.sieveSize.upsert({
      where: { code: r.code },
      create: data,
      update: {
        kind: data.kind,
        sieveCodeFrom: data.sieveCodeFrom,
        sieveCodeTo: data.sieveCodeTo,
        piecesPerCaratAvg: data.piecesPerCaratAvg,
        weightPerPieceCt: data.weightPerPieceCt,
        mmFrom: data.mmFrom,
        mmTo: data.mmTo,
        displayOrder: data.displayOrder,
      },
    });
    mesh += 1;
  }

  for (const r of SINGLE_ROWS) {
    const data: Prisma.SieveSizeCreateInput = {
      kind: 'SINGLE',
      code: r.code,
      sizeLabel: r.sizeLabel,
      weightPerPieceCt: r.weightPerPieceCt,
      mmFrom: r.mmFrom,
      mmTo: r.mmTo,
      displayOrder: r.displayOrder,
      isActive: true,
    };
    await prisma.sieveSize.upsert({
      where: { code: r.code },
      create: data,
      update: {
        kind: data.kind,
        sizeLabel: data.sizeLabel,
        weightPerPieceCt: data.weightPerPieceCt,
        mmFrom: data.mmFrom,
        mmTo: data.mmTo,
        displayOrder: data.displayOrder,
      },
    });
    single += 1;
  }

  return { mesh, single };
}

/**
 * Standalone entry point so this file can be invoked directly via
 * `npx ts-node prisma/seeds/sieve-sizes.ts` without dragging in the full
 * `seed.ts` bundle (useful in CI smoke checks and on prod when only the
 * master data needs refreshing).
 */
async function runStandalone() {
  const prisma = new PrismaClient();
  try {
    const { mesh, single } = await seedSieveSizes(prisma);
    // eslint-disable-next-line no-console
    console.log(`\u2705 Seeded sieve_sizes: ${mesh} MESH + ${single} SINGLE = ${mesh + single} rows`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runStandalone().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('\u274C sieve-sizes seed failed', err);
    process.exit(1);
  });
}
