/**
 * ============================================
 * ATTENDANCE SERVICE
 * ============================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export async function checkIn(
  userId: string,
  data: {
    checkInPhoto: string;
    checkInLat?: number;
    checkInLng?: number;
    checkInDevice?: string;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing && existing.checkInTime) {
    throw new Error('Already checked in today');
  }

  const checkInTime = new Date();

  return await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      checkInTime,
      checkInPhoto: data.checkInPhoto,
      checkInLat: data.checkInLat,
      checkInLng: data.checkInLng,
      checkInDevice: data.checkInDevice,
      status: 'PRESENT',
    },
    create: {
      userId,
      date: today,
      checkInTime,
      checkInPhoto: data.checkInPhoto,
      checkInLat: data.checkInLat,
      checkInLng: data.checkInLng,
      checkInDevice: data.checkInDevice,
      status: 'PRESENT',
    },
  });
}

export async function checkOut(
  userId: string,
  data: {
    checkOutPhoto: string;
    checkOutLat?: number;
    checkOutLng?: number;
    checkOutDevice?: string;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!attendance || !attendance.checkInTime) {
    throw new Error('No check-in found for today');
  }

  if (attendance.checkOutTime) {
    throw new Error('Already checked out today');
  }

  const checkOutTime = new Date();
  const totalHours = (checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);

  return await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime,
      checkOutPhoto: data.checkOutPhoto,
      checkOutLat: data.checkOutLat,
      checkOutLng: data.checkOutLng,
      checkOutDevice: data.checkOutDevice,
      totalHours,
    },
  });
}

export async function getAttendance(userId: string, startDate: Date, endDate: Date) {
  return await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getAllAttendance(date: Date) {
  return await prisma.attendance.findMany({
    where: { date },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          department: true,
        },
      },
    },
    orderBy: { checkInTime: 'asc' },
  });
}

export async function applyLeave(
  userId: string,
  data: {
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason?: string;
  }
) {
  return await prisma.leave.create({
    data: {
      userId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
    },
  });
}

export async function approveLeave(
  leaveId: string,
  approved: boolean,
  approvedById: string,
  rejectionReason?: string
) {
  return await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedById,
      approvedAt: new Date(),
      rejectionReason: approved ? null : rejectionReason,
    },
  });
}

export async function getLeaves(userId?: string, status?: string) {
  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  return await prisma.leave.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createShift(data: {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceMinutes?: number;
  isDefault?: boolean;
}) {
  return await prisma.shift.create({
    data,
  });
}

export async function getAllShifts() {
  return await prisma.shift.findMany({
    include: {
      employees: {
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
    orderBy: { name: 'asc' },
  });
}
