-- ============================================
-- PHASE 5: ATTENDANCE & PAYROLL SYSTEMS
-- Migration: 20260114_add_attendance_payroll
-- ============================================

-- ============================================
-- SHIFT MANAGEMENT
-- ============================================

CREATE TABLE "shifts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "break_minutes" INTEGER NOT NULL DEFAULT 60,
  "grace_minutes" INTEGER NOT NULL DEFAULT 15,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "shifts_is_default_idx" ON "shifts"("is_default");

-- ============================================
-- EMPLOYEE SHIFT ASSIGNMENTS
-- ============================================

CREATE TABLE "employee_shifts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "shift_id" TEXT NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  
  CONSTRAINT "employee_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "employee_shifts_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id")
);

CREATE INDEX "employee_shifts_user_id_idx" ON "employee_shifts"("user_id");
CREATE INDEX "employee_shifts_effective_from_idx" ON "employee_shifts"("effective_from");

-- ============================================
-- ATTENDANCE
-- ============================================

CREATE TABLE "attendance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "check_in_time" TIMESTAMP(3),
  "check_in_photo" TEXT,
  "check_in_lat" DOUBLE PRECISION,
  "check_in_lng" DOUBLE PRECISION,
  "check_in_device" TEXT,
  "check_out_time" TIMESTAMP(3),
  "check_out_photo" TEXT,
  "check_out_lat" DOUBLE PRECISION,
  "check_out_lng" DOUBLE PRECISION,
  "check_out_device" TEXT,
  "total_hours" DOUBLE PRECISION,
  "overtime_hours" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'ABSENT',
  "is_late" BOOLEAN NOT NULL DEFAULT false,
  "late_minutes" INTEGER,
  "is_early_out" BOOLEAN NOT NULL DEFAULT false,
  "early_minutes" INTEGER,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_user_id_date_key" UNIQUE ("user_id", "date")
);

CREATE INDEX "attendance_date_idx" ON "attendance"("date");
CREATE INDEX "attendance_user_id_date_idx" ON "attendance"("user_id", "date");
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- ============================================
-- LEAVE MANAGEMENT
-- ============================================

CREATE TABLE "leaves" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "leave_type" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "total_days" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "leaves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "leaves_user_id_idx" ON "leaves"("user_id");
CREATE INDEX "leaves_status_idx" ON "leaves"("status");
CREATE INDEX "leaves_start_date_idx" ON "leaves"("start_date");

-- ============================================
-- HOLIDAYS
-- ============================================

CREATE TABLE "holidays" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "holidays_date_idx" ON "holidays"("date");

-- ============================================
-- SALARY STRUCTURE
-- ============================================

CREATE TABLE "salary_structures" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "basic_salary" DOUBLE PRECISION NOT NULL,
  "hra" DOUBLE PRECISION,
  "da" DOUBLE PRECISION,
  "conveyance" DOUBLE PRECISION,
  "medical_allow" DOUBLE PRECISION,
  "special_allow" DOUBLE PRECISION,
  "other_allow" DOUBLE PRECISION,
  "per_day_rate" DOUBLE PRECISION,
  "per_hour_rate" DOUBLE PRECISION,
  "overtime_rate" DOUBLE PRECISION,
  "bank_name" TEXT,
  "account_number" TEXT,
  "ifsc_code" TEXT,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "salary_structures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "salary_structures_user_id_idx" ON "salary_structures"("user_id");
CREATE INDEX "salary_structures_effective_from_idx" ON "salary_structures"("effective_from");

-- ============================================
-- PAYROLL PERIODS
-- ============================================

CREATE TABLE "payroll_periods" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "working_days" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "processed_by_id" TEXT,
  "processed_at" TIMESTAMP(3),
  "finalized_by_id" TEXT,
  "finalized_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "payroll_periods_month_year_key" UNIQUE ("month", "year")
);

CREATE INDEX "payroll_periods_month_year_idx" ON "payroll_periods"("month", "year");
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- ============================================
-- PAYSLIPS
-- ============================================

CREATE TABLE "payslips" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "period_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "total_days" INTEGER NOT NULL,
  "present_days" DOUBLE PRECISION NOT NULL,
  "absent_days" DOUBLE PRECISION NOT NULL,
  "leave_days" DOUBLE PRECISION NOT NULL,
  "holidays" INTEGER NOT NULL,
  "overtime_hours" DOUBLE PRECISION NOT NULL,
  "late_deductions" DOUBLE PRECISION,
  "basic_earned" DOUBLE PRECISION NOT NULL,
  "hra_earned" DOUBLE PRECISION,
  "da_earned" DOUBLE PRECISION,
  "conveyance_earned" DOUBLE PRECISION,
  "medical_earned" DOUBLE PRECISION,
  "special_earned" DOUBLE PRECISION,
  "other_earned" DOUBLE PRECISION,
  "overtime_pay" DOUBLE PRECISION,
  "bonus" DOUBLE PRECISION,
  "incentive" DOUBLE PRECISION,
  "gross_earnings" DOUBLE PRECISION NOT NULL,
  "advance_deduction" DOUBLE PRECISION,
  "loan_deduction" DOUBLE PRECISION,
  "other_deduction" DOUBLE PRECISION,
  "total_deductions" DOUBLE PRECISION NOT NULL,
  "net_salary" DOUBLE PRECISION NOT NULL,
  "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
  "payment_date" TIMESTAMP(3),
  "payment_mode" TEXT,
  "transaction_ref" TEXT,
  "payslip_url" TEXT,
  "emailed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "payslips_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
  CONSTRAINT "payslips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "payslips_period_id_user_id_key" UNIQUE ("period_id", "user_id")
);

CREATE INDEX "payslips_user_id_idx" ON "payslips"("user_id");
CREATE INDEX "payslips_period_id_idx" ON "payslips"("period_id");
CREATE INDEX "payslips_payment_status_idx" ON "payslips"("payment_status");

-- ============================================
-- EMPLOYEE ADVANCES
-- ============================================

CREATE TABLE "employee_advances" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "given_date" TIMESTAMP(3) NOT NULL,
  "deduction_per_month" DOUBLE PRECISION NOT NULL,
  "total_deducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remaining_amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "approved_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "employee_advances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "employee_advances_user_id_idx" ON "employee_advances"("user_id");
CREATE INDEX "employee_advances_status_idx" ON "employee_advances"("status");

-- ============================================
-- EMPLOYEE LOANS
-- ============================================

CREATE TABLE "employee_loans" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "loan_amount" DOUBLE PRECISION NOT NULL,
  "interest_rate" DOUBLE PRECISION,
  "tenure" INTEGER NOT NULL,
  "emi_amount" DOUBLE PRECISION NOT NULL,
  "disbursed_date" TIMESTAMP(3) NOT NULL,
  "start_month" TIMESTAMP(3) NOT NULL,
  "total_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remaining_amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "approved_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "employee_loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "employee_loans_user_id_idx" ON "employee_loans"("user_id");
CREATE INDEX "employee_loans_status_idx" ON "employee_loans"("status");

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "shifts" IS 'Work shift definitions';
COMMENT ON TABLE "employee_shifts" IS 'Employee shift assignments';
COMMENT ON TABLE "attendance" IS 'Daily attendance records with photo check-in/out';
COMMENT ON TABLE "leaves" IS 'Leave applications and approvals';
COMMENT ON TABLE "holidays" IS 'Company holidays calendar';
COMMENT ON TABLE "salary_structures" IS 'Employee salary structure definitions';
COMMENT ON TABLE "payroll_periods" IS 'Monthly payroll periods';
COMMENT ON TABLE "payslips" IS 'Employee payslips';
COMMENT ON TABLE "employee_advances" IS 'Employee salary advances';
COMMENT ON TABLE "employee_loans" IS 'Employee loans';
