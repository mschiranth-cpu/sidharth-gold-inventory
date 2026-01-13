# Gold Factory Inventory - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Creating Orders](#creating-orders)
5. [Tracking Orders](#tracking-orders)
6. [Department Workflow](#department-workflow)
7. [Submitting Completed Orders](#submitting-completed-orders)
8. [Reports & Analytics](#reports--analytics)
9. [Notifications](#notifications)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

The Gold Factory Inventory System is a comprehensive solution for tracking gold jewelry orders through the entire production process. From order creation to final delivery, every step is monitored and recorded.

### Key Features

- **Order Management**: Create, track, and manage customer orders
- **Factory Tracking**: Monitor orders as they move through production departments
- **Real-time Updates**: Instant notifications when orders change status
- **Reporting**: Generate detailed reports on production and inventory
- **Quality Control**: Track quality checks and approvals

---

## Getting Started

### Logging In

1. Navigate to the system URL (provided by your administrator)
2. Enter your email address
3. Enter your password
4. Click **Login**

![Login Screen](screenshots/login-screen.png)

> **Tip**: Check "Remember me" to stay logged in on trusted devices.

### First-Time Setup

1. After first login, you'll be prompted to change your password
2. Set up your notification preferences
3. Review your assigned department (if applicable)

### Navigation Overview

![Dashboard Overview](screenshots/dashboard-overview.png)

| Area             | Description                     |
| ---------------- | ------------------------------- |
| **Sidebar**      | Main navigation menu            |
| **Dashboard**    | Quick stats and recent activity |
| **Header**       | Notifications, profile, logout  |
| **Main Content** | Current page content            |

---

## User Roles

### Office Staff

- Create new orders
- View all orders
- Update order details
- Generate reports
- Cannot modify factory workflow

### Factory Manager

- View all orders
- Access Kanban board
- Move orders between departments
- Approve quality checks
- View department performance

### Department Worker

- View orders in their department
- Update order status
- Add notes and progress updates
- Submit completed work
- Cannot access other departments

### Administrator

- All permissions above
- Manage users
- Configure departments
- System settings
- Access audit logs

---

## Creating Orders

### Step 1: Navigate to Create Order

1. Click **Orders** in the sidebar
2. Click the **+ New Order** button

![Create Order Button](screenshots/create-order-button.png)

### Step 2: Enter Customer Information

| Field          | Description                | Required |
| -------------- | -------------------------- | -------- |
| Customer Name  | Company or individual name | ✅       |
| Contact Number | Phone number               | Optional |
| Email          | Customer email             | Optional |
| Address        | Delivery address           | Optional |

![Customer Information Form](screenshots/customer-info-form.png)

### Step 3: Enter Order Details

| Field       | Description           | Example            |
| ----------- | --------------------- | ------------------ |
| Product     | Type of jewelry       | Gold Necklace 22K  |
| Quantity    | Number of pieces      | 5                  |
| Gold Weight | Total weight in grams | 45.5g              |
| Purity      | Gold purity level     | 22K, 24K, 18K, 14K |
| Due Date    | Expected completion   | 2024-02-15         |

![Order Details Form](screenshots/order-details-form.png)

### Step 4: Set Priority

| Priority   | Use When                             |
| ---------- | ------------------------------------ |
| **Low**    | Standard timeline, flexible delivery |
| **Medium** | Normal priority (default)            |
| **High**   | Important customer, tight deadline   |
| **Urgent** | Rush order, top priority             |

### Step 5: Add Notes (Optional)

Add any special instructions:

- Design specifications
- Customer preferences
- Quality requirements
- Packaging instructions

### Step 6: Review and Submit

1. Review all entered information
2. Click **Create Order**
3. Note the generated Order Number (e.g., ORD-2024-001)

![Order Confirmation](screenshots/order-confirmation.png)

---

## Tracking Orders

### Order List View

Navigate to **Orders** to see all orders.

![Orders List](screenshots/orders-list.png)

#### Filtering Orders

| Filter     | Options                                                   |
| ---------- | --------------------------------------------------------- |
| Status     | Pending, In Progress, Quality Check, Completed, Delivered |
| Priority   | Low, Medium, High, Urgent                                 |
| Department | All departments                                           |
| Date Range | Custom date selection                                     |
| Search     | Order number, customer name                               |

#### Sorting Options

- Created Date (newest/oldest)
- Due Date (soonest/latest)
- Priority (highest/lowest)
- Status

### Order Detail View

Click any order to see full details:

![Order Detail](screenshots/order-detail.png)

- **Status Timeline**: Visual history of order progress
- **Current Location**: Which department has the order
- **Time in Department**: How long at current stage
- **Activity Log**: All updates and notes

### Kanban Board View

For visual tracking, use the Kanban board:

1. Click **Factory Tracking** in sidebar
2. View orders grouped by department
3. Drag orders between columns (Managers only)

![Kanban Board](screenshots/kanban-board.png)

---

## Department Workflow

### Understanding the Production Flow

```
Receiving → Melting → Designing → Moulding → Polishing → Quality Check → Packaging → Dispatch
```

### Updating Order Status (Workers)

1. Navigate to **My Department**
2. Find the order in your queue
3. Click **Update Status**

![Department View](screenshots/department-view.png)

### Adding Progress Notes

1. Open the order
2. Click **Add Note**
3. Enter your update
4. Click **Save**

```
Example notes:
- "Melting completed, purity verified at 22K"
- "Design approved by customer"
- "Minor defect found, sent for rework"
```

### Moving to Next Department

**For Factory Managers:**

1. Open the order or use Kanban board
2. Click **Move to Next Department**
3. Select the target department
4. Add transfer notes (optional)
5. Confirm the move

![Move Order](screenshots/move-order.png)

### Handling Issues

If you encounter a problem:

1. Click **Report Issue**
2. Select issue type:
   - Material defect
   - Equipment failure
   - Rework required
   - Missing information
3. Add description
4. Manager will be notified

---

## Submitting Completed Orders

### Quality Check Process

1. After final production, order goes to Quality Check
2. QC team inspects the items
3. Pass or Fail decision

![Quality Check](screenshots/quality-check.png)

### Completing an Order

1. Open the completed order
2. Click **Mark as Completed**
3. Enter final details:
   - Actual gold weight used
   - Any variations from original order
   - Quality notes
4. Upload photos (if required)
5. Click **Submit**

### Delivery Process

1. Order moves to "Completed" status
2. Customer is notified (if configured)
3. Prepare for delivery/pickup
4. Mark as "Delivered" when handed to customer

---

## Reports & Analytics

### Dashboard Statistics

The dashboard shows:

- Total active orders
- Orders due today
- Overdue orders
- Completed this week/month

![Dashboard Stats](screenshots/dashboard-stats.png)

### Generating Reports

1. Navigate to **Reports**
2. Select report type:
   - Orders Report
   - Production Report
   - Department Performance
   - Gold Usage Report
3. Set date range
4. Apply filters
5. Click **Generate**

![Reports Page](screenshots/reports-page.png)

### Export Options

| Format | Use For            |
| ------ | ------------------ |
| PDF    | Printing, sharing  |
| Excel  | Data analysis      |
| CSV    | Data import/export |

### Scheduled Reports

Set up automatic reports:

1. Go to **Reports** → **Scheduled**
2. Click **Create Schedule**
3. Select report type
4. Set frequency (daily/weekly/monthly)
5. Add recipients

---

## Notifications

### Notification Types

| Icon | Type         | Description        |
| ---- | ------------ | ------------------ |
| 🔔   | Order Update | Status changed     |
| ⚠️   | Alert        | Action required    |
| ✅   | Success      | Task completed     |
| 📋   | Assignment   | New order assigned |

### Managing Notifications

1. Click the bell icon in header
2. View recent notifications
3. Click to see details
4. Mark as read

### Notification Preferences

1. Go to **Profile** → **Preferences**
2. Enable/disable notification types
3. Set email notification frequency

---

## Best Practices

### For Office Staff

- ✅ Double-check customer details before submitting
- ✅ Set realistic due dates
- ✅ Add detailed notes for special requirements
- ✅ Follow up on high-priority orders daily

### For Factory Managers

- ✅ Review Kanban board at start of each day
- ✅ Balance workload across departments
- ✅ Address bottlenecks promptly
- ✅ Communicate delays to office staff

### For Workers

- ✅ Update status as soon as work is complete
- ✅ Add notes for any issues encountered
- ✅ Report problems immediately
- ✅ Check queue regularly for new assignments

### General Tips

- 🔐 Never share your login credentials
- 💾 Add notes frequently to maintain history
- 📱 Use notifications to stay informed
- 📊 Review reports to identify trends

---

## Troubleshooting

### Cannot Log In

| Issue             | Solution                           |
| ----------------- | ---------------------------------- |
| Forgot password   | Click "Forgot Password" link       |
| Account locked    | Contact administrator              |
| Wrong credentials | Check email and password carefully |

### Order Not Showing

1. Check your filters - reset to "All"
2. Try searching by order number
3. Verify you have permission to view
4. Refresh the page

### Status Won't Update

1. Ensure you have proper permissions
2. Check if order is in your department
3. Clear browser cache
4. Contact support if persists

### Slow Performance

1. Clear browser cache and cookies
2. Try a different browser
3. Check your internet connection
4. Report to IT if ongoing

### Missing Notifications

1. Check notification preferences
2. Verify email address is correct
3. Check spam folder for emails
4. Enable browser notifications

---

## FAQ

### General Questions

**Q: How do I change my password?**
A: Go to Profile → Security → Change Password

**Q: Can I access the system on mobile?**
A: Yes, the system is mobile-responsive. Open in any mobile browser.

**Q: How long is data retained?**
A: Order data is retained for 7 years as per policy.

### Orders

**Q: Can I edit an order after creation?**
A: Yes, until it moves to production. After that, only managers can modify.

**Q: How do I cancel an order?**
A: Only managers can cancel orders. Contact your supervisor.

**Q: What happens to deleted orders?**
A: Orders are soft-deleted and can be recovered by admin.

### Factory Tracking

**Q: Why can't I move orders between departments?**
A: Only Factory Managers have this permission.

**Q: How do I see historical department times?**
A: Click on the order → View Timeline.

**Q: Can I process multiple orders at once?**
A: Yes, select multiple orders and use "Bulk Actions".

### Reports

**Q: Why is my report empty?**
A: Check your date range and filters.

**Q: Can I save custom report configurations?**
A: Yes, click "Save as Template" after configuring.

**Q: How often is data updated?**
A: Data updates in real-time.

---

## Getting Help

### In-App Help

- Click the **?** icon on any page for context-specific help
- Hover over form fields for tooltips

### Support Contact

- **Email**: support@goldfactory.com
- **Phone**: +91-XXXX-XXXXXX
- **Hours**: Mon-Sat, 9 AM - 6 PM

### Report a Bug

1. Click **Help** → **Report Issue**
2. Describe the problem
3. Attach screenshots if possible
4. Submit

---

_Last Updated: January 2026_
_Version: 1.0.0_
