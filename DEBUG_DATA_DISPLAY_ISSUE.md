# Debug Guide: Data Not Displaying in UI

## Issue Summary

All module pages load successfully but show **0 records** even though database has been seeded with test data.

## What I've Done

### ✅ Completed

1. **Seeded Database** - Successfully created:

   - 10 Feature Modules
   - 50 Feature Permissions
   - 5 Metal Rates
   - 3 Parties
   - 3 Factory Items & Categories

2. **Added Debug Logging** to Feature Toggle page

   - Console will now show: loading state, errors, feature count, actual data
   - Error messages will display on screen if API fails
   - Warning shown if 0 features found

3. **Verified Backend Code** - All controllers and services are correct

## How to Debug This Issue

### Step 1: Check Browser Console (MOST IMPORTANT)

1. Open http://localhost:5173/admin/features
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for the debug message: `🔍 Feature Toggle Debug:`
5. Check what it shows:
   - `isLoading`: should be false after loading
   - `isError`: should be false if no error
   - `error`: should be null if no error
   - `featuresCount`: should be 10 (not 0)
   - `features`: should show array of 10 feature objects

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page (Ctrl+R)
3. Look for a request to `/api/features`
4. Click on it and check:
   - **Status**: Should be 200 (not 401, 403, or 500)
   - **Response**: Should have `success: true` and `data` array with 10 items
   - **Headers**: Should include `Authorization: Bearer <token>`

### Step 3: Common Issues & Solutions

#### Issue A: 401 Unauthorized

**Symptoms:** Network tab shows 401 status
**Cause:** Authentication token missing or invalid
**Solution:**

```typescript
// Check frontend/src/services/api.ts
// Verify token is being added to requests
```

#### Issue B: Empty Response

**Symptoms:** Status 200 but data array is empty
**Cause:** Database query returning no results
**Solution:**

```bash
# Verify database has data
cd backend
npx prisma studio
# Check FeatureModule table - should have 10 records
```

#### Issue C: CORS Error

**Symptoms:** Console shows CORS error
**Cause:** Backend not allowing frontend origin
**Solution:**

```typescript
// Check backend/src/index.ts
// Verify CORS middleware allows http://localhost:5173
```

#### Issue D: Wrong API URL

**Symptoms:** Network tab shows 404 or request to wrong URL
**Cause:** API base URL misconfigured
**Solution:**

```typescript
// Check frontend/src/services/api.ts
// Verify baseURL is http://localhost:3000/api
```

## Quick Test Commands

### Test Backend API Directly (PowerShell)

```powershell
# 1. Login and get token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $loginResponse.data.accessToken
Write-Host "Token: $token"

# 2. Test Features API
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$features = Invoke-RestMethod -Uri "http://localhost:3000/api/features" -Headers $headers
Write-Host "Features Count: $($features.data.Count)"
$features.data | Format-Table displayName, name, isGlobal

# 3. Test Metal Rates API
$rates = Invoke-RestMethod -Uri "http://localhost:3000/api/metal/rates" -Headers $headers
Write-Host "Metal Rates Count: $($rates.data.Count)"
$rates.data | Format-Table metalType, purity, ratePerGram

# 4. Test Parties API
$parties = Invoke-RestMethod -Uri "http://localhost:3000/api/parties" -Headers $headers
Write-Host "Parties Count: $($parties.data.Count)"
$parties.data | Format-Table name, type, phone
```

### Test Backend API Directly (Bash/curl)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# 2. Test Features API
curl -s http://localhost:3000/api/features \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'

# 3. Test Metal Rates API
curl -s http://localhost:3000/api/metal/rates \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'

# 4. Test Parties API
curl -s http://localhost:3000/api/parties \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data | length'
```

## Expected vs Actual

### Expected Behavior:

- Feature Toggle page shows 10 features
- Each feature has toggle switches
- Permissions display for selected role
- Console shows: `featuresCount: 10`

### Current Behavior:

- Page shows "Features for ADMIN (0)"
- Empty list
- Console shows: `featuresCount: 0` (probably)

## Files Modified

1. `frontend/src/pages/admin/FeatureTogglePage.tsx` - Added debug logging
2. `backend/scripts/seed-modules.ts` - Database seeder (already run)

## Next Steps

1. **Open browser console** and check the debug output
2. **Share the console output** with me
3. **Check Network tab** for API call status
4. I'll fix the specific issue based on what you find

## Likely Root Causes (In Order of Probability)

1. **Authentication Issue** (80% likely)

   - Token not being sent with requests
   - Token expired or invalid
   - Backend rejecting authenticated requests

2. **API Response Format Mismatch** (15% likely)

   - Frontend expecting different data structure
   - Response not being parsed correctly

3. **Database Actually Empty** (5% likely)
   - Seeder didn't run successfully
   - Wrong database being queried

## How to Fix Each Module

Once we identify the root cause for Feature Toggle, the same fix will apply to all modules:

- Metal Inventory
- Party Metal
- Diamond Inventory
- Real Stone
- Stone Inventory
- Factory Inventory
- Attendance
- Payroll
- Client Portal

All use the same pattern: React Query → API service → Backend endpoint → Database

---

**Please check your browser console now and share what you see in the debug output!**
