# Removed Sections - To Be Used in Admin Form Later

This file contains the sections that were removed from the order creation form. These will be integrated into an admin-only form in the future.

## 1. Pricing Details Section

**Location:** AdditionalInfoStep.tsx (lines 500-540)

```tsx
{
  /* Pricing Details */
}
<div className="space-y-3">
  <label className="block text-sm font-medium text-gray-700">
    Pricing Details
  </label>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <Controller
      name="makingChargeType"
      control={control}
      render={({ field }) => (
        <select
          {...field}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Making Charge Type</option>
          {MAKING_CHARGE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    />
    <input
      type="number"
      step="0.01"
      {...register("makingChargeValue", { valueAsNumber: true })}
      placeholder="Value"
      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
    />
    <input
      type="number"
      step="0.1"
      {...register("wastagePercentage", { valueAsNumber: true })}
      placeholder="Wastage %"
      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
    />
  </div>
  <input
    type="number"
    step="0.01"
    {...register("laborCharges", { valueAsNumber: true })}
    placeholder="Labor Charges"
    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
  />
</div>;
```

**Related TypeScript Fields:**

```typescript
// In AdditionalInfoFormData interface
makingChargeType?: MakingChargeType;
makingChargeValue?: number;
wastagePercentage?: number;
laborCharges?: number;
```

**Database Schema Fields:**

```prisma
// In OrderDetails model
makingChargeType      String?  // PER_GRAM, FLAT_RATE, PERCENTAGE
makingChargeValue     Float?   // Value based on type
wastagePercentage     Float?   // Estimated gold wastage %
laborCharges          Float?   // Additional labor costs
```

---

## 2. Price Estimation Section

**Location:** AdditionalInfoStep.tsx (lines 964-1058)

```tsx
{
  /* ============================================
  PRICE ESTIMATION
============================================ */
}
<div className="border-t pt-6">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Estimation</h3>
  <p className="text-sm text-gray-600 mb-4">
    Provide cost estimates for this order. These can be manually entered or
    auto-calculated based on current rates.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Estimated Gold Cost */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimated Gold Cost (₹)
      </label>
      <input
        type="number"
        {...register("estimatedGoldCost", {
          min: 0,
        })}
        placeholder="Gold cost"
        step="0.01"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Estimated Stone Cost */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimated Stone Cost (₹)
      </label>
      <input
        type="number"
        {...register("estimatedStoneCost", {
          min: 0,
        })}
        placeholder="Stone cost"
        step="0.01"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Estimated Making Charges */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimated Making Charges (₹)
      </label>
      <input
        type="number"
        {...register("estimatedMakingCharges", {
          min: 0,
        })}
        placeholder="Making charges"
        step="0.01"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Estimated Other Charges */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimated Other Charges (₹)
      </label>
      <input
        type="number"
        {...register("estimatedOtherCharges", {
          min: 0,
        })}
        placeholder="Other charges (certification, etc.)"
        step="0.01"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Estimated Total Cost */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimated Total Cost (₹)
      </label>
      <input
        type="number"
        {...register("estimatedTotalCost", {
          min: 0,
        })}
        placeholder="Total estimated cost"
        step="0.01"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold text-lg"
      />
      <p className="text-xs text-gray-500 mt-1">
        This can be manually entered or calculated from the above fields
      </p>
    </div>
  </div>
</div>;
```

**Related TypeScript Fields:**

```typescript
// In AdditionalInfoFormData interface
estimatedGoldCost?: number;
estimatedStoneCost?: number;
estimatedMakingCharges?: number;
estimatedOtherCharges?: number;
estimatedTotalCost?: number;
```

**Database Schema Fields:**

```prisma
// In OrderDetails model
estimatedGoldCost     Float?   // Estimated cost of gold
estimatedStoneCost    Float?   // Estimated cost of stones
estimatedMakingCharges Float?  // Estimated making charges
estimatedOtherCharges Float?   // Other charges (certification, etc.)
estimatedTotalCost    Float?   // Total estimated cost
```

---

## 3. Warranty Period Field

**Location:** AdditionalInfoStep.tsx (lines 859-873)

```tsx
{
  /* Warranty Period */
}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Warranty Period
  </label>
  <select
    {...register("warrantyPeriod")}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Select warranty</option>
    {WARRANTY_PERIOD_OPTIONS.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
</div>;
```

**Related TypeScript Fields:**

```typescript
// In AdditionalInfoFormData interface
warrantyPeriod?: WarrantyPeriod;

// Enum definition
export enum WarrantyPeriod {
  NONE = 'NONE',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
  TWO_YEARS = 'TWO_YEARS',
  LIFETIME = 'LIFETIME',
}

// Options array
export const WARRANTY_PERIOD_OPTIONS = [
  { value: WarrantyPeriod.NONE, label: 'No Warranty' },
  { value: WarrantyPeriod.SIX_MONTHS, label: '6 Months' },
  { value: WarrantyPeriod.ONE_YEAR, label: '1 Year' },
  { value: WarrantyPeriod.TWO_YEARS, label: '2 Years' },
  { value: WarrantyPeriod.LIFETIME, label: 'Lifetime' },
];
```

**Database Schema Field:**

```prisma
// In OrderDetails model
warrantyPeriod        String?  // NONE, SIX_MONTHS, ONE_YEAR, TWO_YEARS, LIFETIME
```

---

## Notes for Future Implementation

1. **Admin Form Integration**: These sections should be added to an admin-only form where pricing and warranty details can be managed.

2. **Database Fields**: All database fields remain intact in the schema. They are optional fields, so no migration is needed.

3. **TypeScript Types**: All types remain defined in `order.types.ts`. The fields are already optional, so no breaking changes.

4. **Backend API**: The backend API already handles these fields as optional, so no changes needed there.

5. **Future Access**: When implementing the admin form, import these sections and integrate them into the admin interface with appropriate role-based access control.

6. **Related Enums and Constants**:
   - `MakingChargeType` enum
   - `WarrantyPeriod` enum
   - `MAKING_CHARGE_TYPE_OPTIONS` constant
   - `WARRANTY_PERIOD_OPTIONS` constant
   - `POLISH_TYPE_OPTIONS` constant

All these remain in the codebase for future use.
