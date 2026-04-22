/**
 * ============================================
 * PAYROLL SERVICE
 * ============================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export async function createSalaryStructure(userId: string, data: any) {
  return await prisma.salaryStructure.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function getSalaryStructure(userId: string) {
  return await prisma.salaryStructure.findFirst({
    where: {
      userId,
      effectiveTo: null,
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}

export async function createPayrollPeriod(data: {
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
  workingDays: number;
}) {
  return await prisma.payrollPeriod.create({
    data,
  });
}

export async function processPayroll(periodId: string, processedById: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw new Error('Payroll period not found');
  }

  const employees = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
    },
    include: {
      salaryStructures: {
        where: {
          effectiveFrom: { lte: period.endDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }],
        },
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      },
      attendanceRecords: {
        where: {
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
      },
      employeeAdvances: {
        where: { status: 'ACTIVE' },
      },
      employeeLoans: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  for (const employee of employees) {
    const salaryStructure = employee.salaryStructures[0];
    if (!salaryStructure) continue;

    const presentDays = employee.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const absentDays = employee.attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const leaveDays = employee.attendanceRecords.filter((a) => a.status === 'LEAVE').length;
    const overtimeHours = employee.attendanceRecords.reduce(
      (sum, a) => sum + (a.overtimeHours || 0),
      0
    );

    const perDayRate = salaryStructure.basicSalary / period.workingDays;
    const basicEarned = perDayRate * presentDays;
    const overtimePay = overtimeHours * (salaryStructure.overtimeRate || 0);

    const grossEarnings =
      basicEarned +
      (salaryStructure.hra || 0) +
      (salaryStructure.da || 0) +
      (salaryStructure.conveyance || 0) +
      overtimePay;

    const advanceDeduction = employee.employeeAdvances.reduce(
      (sum, a) => sum + a.deductionPerMonth,
      0
    );
    const loanDeduction = employee.employeeLoans.reduce((sum, l) => sum + l.emiAmount, 0);
    const totalDeductions = advanceDeduction + loanDeduction;

    const netSalary = grossEarnings - totalDeductions;

    await prisma.payslip.create({
      data: {
        periodId,
        userId: employee.id,
        totalDays: period.workingDays,
        presentDays,
        absentDays,
        leaveDays,
        holidays: 0,
        overtimeHours,
        basicEarned,
        hraEarned: salaryStructure.hra,
        daEarned: salaryStructure.da,
        conveyanceEarned: salaryStructure.conveyance,
        overtimePay,
        grossEarnings,
        advanceDeduction,
        loanDeduction,
        totalDeductions,
        netSalary,
      },
    });
  }

  await prisma.payrollPeriod.update({
    where: { id: periodId },
    data: {
      status: 'PROCESSING',
      processedById,
      processedAt: new Date(),
    },
  });

  logger.info('Payroll processed', { periodId, employeeCount: employees.length });
}

export async function getPayrollPeriods() {
  return await prisma.payrollPeriod.findMany({
    include: {
      payslips: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { year: 'desc', month: 'desc' },
  });
}

export async function getPayslip(payslipId: string) {
  return await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      user: true,
      period: true,
    },
  });
}

export async function getMyPayslips(userId: string) {
  return await prisma.payslip.findMany({
    where: { userId },
    include: {
      period: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createEmployeeAdvance(
  userId: string,
  data: {
    amount: number;
    reason?: string;
    deductionPerMonth: number;
    approvedById: string;
  }
) {
  return await prisma.employeeAdvance.create({
    data: {
      userId,
      amount: data.amount,
      reason: data.reason,
      givenDate: new Date(),
      deductionPerMonth: data.deductionPerMonth,
      remainingAmount: data.amount,
      approvedById: data.approvedById,
    },
  });
}

export async function createEmployeeLoan(
  userId: string,
  data: {
    loanAmount: number;
    interestRate?: number;
    tenure: number;
    emiAmount: number;
    approvedById: string;
  }
) {
  return await prisma.employeeLoan.create({
    data: {
      userId,
      loanAmount: data.loanAmount,
      interestRate: data.interestRate,
      tenure: data.tenure,
      emiAmount: data.emiAmount,
      disbursedDate: new Date(),
      startMonth: new Date(),
      remainingAmount: data.loanAmount,
      approvedById: data.approvedById,
    },
  });
}
