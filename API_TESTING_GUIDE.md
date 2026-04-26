# API Testing Guide - Backend Verification

**Purpose:** Test all module APIs directly to verify backend functionality before UI testing

---

## Setup

### 1. Ensure Backend is Running

```bash
# Backend should be running on http://localhost:3000
# Check by visiting: http://localhost:3000/health
```

### 2. Get Authentication Token

```bash
# Login as Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Save the token from response
# TOKEN=<your_token_here>
```

---

## Module 1: Feature Toggle API Tests

### Get All Features (Admin)

```bash
curl -X GET http://localhost:3000/api/features \
  -H "Authorization: Bearer $TOKEN"
```

### Get My Features

```bash
curl -X GET http://localhost:3000/api/features/my-features \
  -H "Authorization: Bearer $TOKEN"
```

### Create Feature

```bash
curl -X POST http://localhost:3000/api/features \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "advanced_reporting",
    "displayName": "Advanced Reporting",
    "description": "Advanced analytics and custom reports",
    "icon": "chart",
    "isGlobal": true
  }'
```

### Update Feature Permission

```bash
curl -X POST http://localhost:3000/api/features/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "featureId": "<feature_id>",
    "role": "OFFICE_STAFF",
    "isEnabled": true,
    "canRead": true,
    "canWrite": false,
    "canDelete": false
  }'
```

---

## Module 2: Client Portal API Tests

### Register Client

```bash
curl -X POST http://localhost:3000/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh.kumar@example.com",
    "password": "client123",
    "name": "Rajesh Kumar",
    "businessName": "Kumar Jewellers",
    "phone": "+91 9876543210",
    "businessType": "Retailer"
  }'
```

### Get All Clients (Admin)

```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer $TOKEN"
```

### Approve Client

```bash
curl -X POST http://localhost:3000/api/clients/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<client_id>",
    "approved": true
  }'
```

### Client Login

```bash
curl -X POST http://localhost:3000/api/clients/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh.kumar@example.com",
    "password": "client123"
  }'
```

### Place Order (Client)

```bash
curl -X POST http://localhost:3000/api/clients/orders \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Mrs. Sharma",
    "customerPhone": "+91 9876543211",
    "productType": "Necklace Set",
    "goldWeightInitial": 50,
    "purity": 22,
    "goldColor": "Yellow",
    "metalType": "GOLD",
    "quantity": 1,
    "dueDate": "2026-02-15T00:00:00.000Z",
    "specialInstructions": "Antique finish required"
  }'
```

---

## Module 3: Metal Inventory API Tests

### Get Metal Stock

```bash
curl -X GET http://localhost:3000/api/metal/stock \
  -H "Authorization: Bearer $TOKEN"
```

### Get Stock Summary

```bash
curl -X GET http://localhost:3000/api/metal/stock/summary \
  -H "Authorization: Bearer $TOKEN"
```

### Create Metal Stock (Receive)

```bash
curl -X POST http://localhost:3000/api/metal/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metalType": "GOLD",
    "purity": 91.67,
    "form": "BAR",
    "grossWeight": 1000,
    "pureWeight": 916.7,
    "location": "Main Vault",
    "batchNumber": "BATCH-2026-001",
    "supplier": "Tanishq Bullion",
    "invoiceNumber": "INV-2026-001"
  }'
```

### Create Metal Transaction (Issue)

```bash
curl -X POST http://localhost:3000/api/metal/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "ISSUE",
    "metalType": "GOLD",
    "purity": 91.67,
    "form": "BAR",
    "grossWeight": 55,
    "pureWeight": 50.42,
    "orderId": "<order_id>",
    "purpose": "Production - Necklace Set",
    "issuedTo": "Factory Manager"
  }'
```

### Create Melting Batch

```bash
curl -X POST http://localhost:3000/api/metal/melting-batches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchNumber": "MB-2026-001",
    "inputMetals": [
      {"metalType": "GOLD", "purity": 75, "weight": 100},
      {"metalType": "GOLD", "purity": 83.33, "weight": 50}
    ],
    "totalInputWeight": 150,
    "outputPurity": 91.67,
    "outputWeight": 145,
    "wastageWeight": 5,
    "wastagePercent": 3.33,
    "notes": "Melting old gold scrap"
  }'
```

### Get Current Rates

```bash
curl -X GET http://localhost:3000/api/metal/rates \
  -H "Authorization: Bearer $TOKEN"
```

### Create/Update Rate

```bash
curl -X POST http://localhost:3000/api/metal/rates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metalType": "GOLD",
    "purity": 100,
    "ratePerGram": 7200,
    "effectiveDate": "2026-01-15T00:00:00.000Z",
    "source": "MCX"
  }'
```

---

## Module 4: Party Metal API Tests

### Create Party

```bash
curl -X POST http://localhost:3000/api/parties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Karigar",
    "type": "KARIGAR",
    "phone": "+91 9876511111",
    "address": "Shop 15, Zaveri Bazaar, Mumbai",
    "gstNumber": "27AABCR1234F1Z5",
    "panNumber": "AABCR1234F"
  }'
```

### Get All Parties

```bash
curl -X GET http://localhost:3000/api/parties \
  -H "Authorization: Bearer $TOKEN"
```

### Create Party Transaction

```bash
curl -X POST http://localhost:3000/api/parties/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "<party_id>",
    "transactionType": "RECEIVE",
    "metalType": "GOLD",
    "declaredPurity": 91.67,
    "testedPurity": 90.83,
    "grossWeight": 200,
    "pureWeight": 181.67,
    "voucherNumber": "RK-001",
    "notes": "Received old gold for melting"
  }'
```

### Get Party Accounts

```bash
curl -X GET http://localhost:3000/api/parties/<party_id>/accounts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Module 5: Diamond Inventory API Tests

### Create Diamond

```bash
curl -X POST http://localhost:3000/api/diamonds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stockNumber": "DIA-001",
    "caratWeight": 0.50,
    "color": "E",
    "clarity": "VVS1",
    "cut": "Excellent",
    "shape": "ROUND",
    "measurements": "5.1mm",
    "certificationLab": "GIA",
    "certNumber": "2141234567",
    "pricePerCarat": 350000,
    "totalPrice": 175000,
    "status": "IN_STOCK"
  }'
```

### Get All Diamonds

```bash
curl -X GET "http://localhost:3000/api/diamonds?status=IN_STOCK" \
  -H "Authorization: Bearer $TOKEN"
```

### Issue Diamond

```bash
curl -X POST http://localhost:3000/api/diamonds/issue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diamondId": "<diamond_id>",
    "orderId": "<order_id>",
    "issuedFor": "Main stone for necklace pendant"
  }'
```

### Create Diamond Lot

```bash
curl -X POST http://localhost:3000/api/diamonds/lots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lotNumber": "LOT-DIA-001",
    "description": "Round Brilliant Cut Diamonds",
    "totalPieces": 10,
    "totalCarats": 5.0,
    "avgPricePerCarat": 300000
  }'
```

---

## Module 6: Real Stone API Tests

### Create Real Stone

```bash
curl -X POST http://localhost:3000/api/stones/real \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stockNumber": "RS-001",
    "stoneType": "RUBY",
    "caratWeight": 2.50,
    "shape": "Oval",
    "color": "Pigeon Blood Red",
    "clarity": "Eye Clean",
    "origin": "Burma (Myanmar)",
    "treatment": "Heated",
    "pricePerCarat": 150000,
    "totalPrice": 375000,
    "status": "IN_STOCK"
  }'
```

### Get All Real Stones

```bash
curl -X GET "http://localhost:3000/api/stones/real?stoneType=RUBY" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Module 7: Stone Inventory API Tests

### Create Stone Packet

```bash
curl -X POST http://localhost:3000/api/stones/packets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packetNumber": "PKT-001",
    "stoneType": "CZ",
    "shape": "Round",
    "size": "2mm",
    "color": "White",
    "quality": "AAA",
    "totalWeight": 100,
    "currentWeight": 100,
    "unit": "PIECES",
    "pricePerUnit": 50,
    "totalPrice": 5000
  }'
```

### Get All Stone Packets

```bash
curl -X GET http://localhost:3000/api/stones/packets \
  -H "Authorization: Bearer $TOKEN"
```

### Create Packet Transaction

```bash
curl -X POST http://localhost:3000/api/stones/packets/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packetId": "<packet_id>",
    "transactionType": "ISSUE",
    "quantity": 25,
    "orderId": "<order_id>",
    "notes": "For side stone setting"
  }'
```

---

## Module 8: Factory Inventory API Tests

### Create Category

```bash
curl -X POST http://localhost:3000/api/factory-inventory/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tools & Equipment",
    "description": "Jewellery making tools and equipment"
  }'
```

### Create Factory Item

```bash
curl -X POST http://localhost:3000/api/factory-inventory/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemCode": "TOOL-001",
    "name": "Jewelers Torch",
    "categoryId": "<category_id>",
    "unit": "PIECES",
    "currentStock": 5,
    "minStock": 2,
    "maxStock": 10,
    "isEquipment": true,
    "location": "Tool Room A"
  }'
```

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/factory-inventory/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "<item_id>",
    "transactionType": "ISSUE",
    "quantity": 1,
    "issuedTo": "Department Worker",
    "purpose": "CAD Department",
    "notes": "For wax model creation"
  }'
```

### Log Equipment Maintenance

```bash
curl -X POST http://localhost:3000/api/factory-inventory/maintenance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "<item_id>",
    "maintenanceType": "PREVENTIVE",
    "description": "Regular cleaning and calibration",
    "cost": 500,
    "performedAt": "2026-01-15T00:00:00.000Z",
    "nextDueDate": "2026-02-15T00:00:00.000Z"
  }'
```

---

## Module 9: Attendance API Tests

### Check In

```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "<shift_id>",
    "location": "Factory Floor",
    "notes": "Regular check-in"
  }'
```

### Check Out

```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Day completed"
  }'
```

### Get My Attendance

```bash
curl -X GET "http://localhost:3000/api/attendance/my-attendance?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Apply Leave

```bash
curl -X POST http://localhost:3000/api/attendance/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "CASUAL",
    "startDate": "2026-01-20T00:00:00.000Z",
    "endDate": "2026-01-21T00:00:00.000Z",
    "reason": "Personal work",
    "days": 2
  }'
```

### Approve Leave (Admin)

```bash
curl -X PUT http://localhost:3000/api/attendance/leaves/<leave_id>/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

---

## Module 10: Payroll API Tests

### Create Salary Structure

```bash
curl -X POST http://localhost:3000/api/payroll/salary-structure/<user_id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basicSalary": 50000,
    "hra": 20000,
    "conveyanceAllowance": 5000,
    "specialAllowance": 10000,
    "pfDeduction": 6000,
    "professionalTax": 200,
    "tds": 5000
  }'
```

### Create Payroll Period

```bash
curl -X POST http://localhost:3000/api/payroll/periods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 1,
    "year": 2026,
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T00:00:00.000Z",
    "workingDays": 26
  }'
```

### Process Payroll

```bash
curl -X POST http://localhost:3000/api/payroll/periods/<period_id>/process \
  -H "Authorization: Bearer $TOKEN"
```

### Get My Payslips

```bash
curl -X GET http://localhost:3000/api/payroll/my-payslips \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing Checklist

Use this checklist while testing:

- [ ] All GET endpoints return 200 OK
- [ ] All POST endpoints return 201 Created
- [ ] Authentication required endpoints return 401 without token
- [ ] Role-based endpoints return 403 for unauthorized roles
- [ ] Data validation works (try invalid data)
- [ ] Response format is consistent
- [ ] Error messages are descriptive
- [ ] Related data is properly linked (foreign keys)
- [ ] Timestamps are automatically set
- [ ] Calculations are accurate (weights, prices, etc.)

---

## Next: UI Testing

After verifying all APIs work correctly:

1. Open http://localhost:5173 in browser
2. Login with test credentials
3. Navigate to each module
4. Verify UI displays API data correctly
5. Test form submissions
6. Verify real-time updates
7. Test filters and search
8. Check responsive design

---

**Note:** Replace `<placeholders>` with actual IDs from API responses.
