import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;
  private offlineQueue: Array<{ method: string; url: string; data?: any }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (!error.response) {
          // Network error - queue for offline
          await this.queueOfflineRequest(error.config);
        }
        throw error;
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  // Orders
  async getOrders(params?: { status?: string; page?: number }) {
    const { data } = await this.client.get('/orders', { params });
    return data;
  }

  async getOrder(id: string) {
    const { data } = await this.client.get(`/orders/${id}`);
    return data;
  }

  async updateOrderStatus(id: string, status: string, notes?: string, photoUrl?: string) {
    const { data } = await this.client.patch(`/orders/${id}/status`, { status, notes, photoUrl });
    return data;
  }

  // QR Scan
  async scanQR(qrData: string, newStatus: string, department?: string, notes?: string, photoUrl?: string) {
    const { data } = await this.client.post('/qrcode/scan', {
      qrData,
      newStatus,
      department,
      notes,
      photoUrl,
    });
    return data;
  }

  async trackOrder(trackingCode: string) {
    const { data } = await this.client.get(`/qrcode/track/${trackingCode}`);
    return data;
  }

  // Offline support
  private async queueOfflineRequest(config: any) {
    this.offlineQueue.push({
      method: config.method,
      url: config.url,
      data: config.data,
    });
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  async syncOfflineQueue() {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    const stored = await AsyncStorage.getItem('offlineQueue');
    if (!stored) return;

    const queue = JSON.parse(stored);
    const failed: any[] = [];

    for (const req of queue) {
      try {
        await this.client.request({ method: req.method, url: req.url, data: req.data });
      } catch {
        failed.push(req);
      }
    }

    if (failed.length > 0) {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(failed));
    } else {
      await AsyncStorage.removeItem('offlineQueue');
    }
  }
}

export const api = new ApiService();
