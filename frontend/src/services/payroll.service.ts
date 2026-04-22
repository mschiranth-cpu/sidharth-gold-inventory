/**
 * ============================================
 * PAYROLL SERVICE
 * ============================================
 */

import api from './api';

export interface SalaryStructure {
  id: string;
  userId: string;
  basicSalary: number;
  hra?: number;
  da?: number;
  conveyance?: number;
  medicalAllow?: number;
  specialAllow?: number;
  otherAllow?: number;
  perDayRate?: number;
  perHourRate?: number;
  overtimeRate?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  createdAt: string;
  payslips?: Payslip[];
}

export interface Payslip {
  id: string;
  periodId: string;
  userId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidays: number;
  overtimeHours: number;
  basicEarned: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  period?: PayrollPeriod;
}

export async function createSalaryStructure(userId: string, data: any) {
  const response = await api.post(`/payroll/salary-structure/${userId}`, data);
  return response.data.data;
}

export async function getSalaryStructure(userId: string): Promise<SalaryStructure> {
  const response = await api.get(`/payroll/salary-structure/${userId}`);
  return response.data.data;
}

export async function createPayrollPeriod(data: {
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
  workingDays: number;
}) {
  const response = await api.post('/payroll/periods', data);
  return response.data.data;
}

export async function processPayroll(periodId: string) {
  const response = await api.post(`/payroll/periods/${periodId}/process`);
  return response.data;
}

export async function getPayrollPeriods(): Promise<PayrollPeriod[]> {
  const response = await api.get('/payroll/periods');
  return response.data.data;
}

export async function getPayslip(payslipId: string): Promise<Payslip> {
  const response = await api.get(`/payroll/payslips/${payslipId}`);
  return response.data.data;
}

export async function getMyPayslips(): Promise<Payslip[]> {
  const response = await api.get('/payroll/my-payslips');
  return response.data.data;
}

export async function createEmployeeAdvance(
  userId: string,
  data: {
    amount: number;
    reason?: string;
    deductionPerMonth: number;
  }
) {
  const response = await api.post(`/payroll/advances/${userId}`, data);
  return response.data.data;
}

export async function createEmployeeLoan(
  userId: string,
  data: {
    loanAmount: number;
    interestRate?: number;
    tenure: number;
    emiAmount: number;
  }
) {
  const response = await api.post(`/payroll/loans/${userId}`, data);
  return response.data.data;
}
