/**
 * ============================================
 * ATTENDANCE SERVICE
 * ============================================
 */

import api from './api';

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkInPhoto?: string;
  checkOutTime?: string;
  checkOutPhoto?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: string;
  isLate: boolean;
  lateMinutes?: number;
  createdAt: string;
}

export interface Leave {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  isDefault: boolean;
}

export async function checkIn(data: {
  checkInPhoto: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInDevice?: string;
}) {
  const response = await api.post('/attendance/check-in', data);
  return response.data.data;
}

export async function checkOut(data: {
  checkOutPhoto: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutDevice?: string;
}) {
  const response = await api.post('/attendance/check-out', data);
  return response.data.data;
}

export async function getMyAttendance(startDate: string, endDate: string): Promise<Attendance[]> {
  const response = await api.get('/attendance/my-attendance', {
    params: { startDate, endDate },
  });
  return response.data.data;
}

export async function getAllAttendance(date: string): Promise<Attendance[]> {
  const response = await api.get('/attendance/all', {
    params: { date },
  });
  return response.data.data;
}

export async function applyLeave(data: {
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
}) {
  const response = await api.post('/attendance/leaves', data);
  return response.data.data;
}

export async function approveLeave(
  leaveId: string,
  data: {
    approved: boolean;
    rejectionReason?: string;
  }
) {
  const response = await api.put(`/attendance/leaves/${leaveId}/approve`, data);
  return response.data.data;
}

export async function getLeaves(userId?: string, status?: string): Promise<Leave[]> {
  const response = await api.get('/attendance/leaves', {
    params: { userId, status },
  });
  return response.data.data;
}

export async function createShift(data: {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceMinutes?: number;
  isDefault?: boolean;
}) {
  const response = await api.post('/attendance/shifts', data);
  return response.data.data;
}

export async function getAllShifts(): Promise<Shift[]> {
  const response = await api.get('/attendance/shifts');
  return response.data.data;
}
