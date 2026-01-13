import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const orders = await api.getOrders();
      return {
        total: orders.data?.length || 0,
        pending: orders.data?.filter((o: any) => o.status === 'pending').length || 0,
        inProgress: orders.data?.filter((o: any) => o.status === 'in_progress').length || 0,
        completed: orders.data?.filter((o: any) => o.status === 'completed').length || 0,
      };
    },
  });

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.department}>{user?.department || user?.role}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Orders" value={stats?.total || 0} color="#D4AF37" />
        <StatCard title="Pending" value={stats?.pending || 0} color="#FFA500" />
        <StatCard title="In Progress" value={stats?.inProgress || 0} color="#4169E1" />
        <StatCard title="Completed" value={stats?.completed || 0} color="#32CD32" />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>View All Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { padding: 20, paddingTop: 40 },
  greeting: { color: '#888', fontSize: 16 },
  userName: { color: '#D4AF37', fontSize: 28, fontWeight: 'bold' },
  department: { color: '#666', fontSize: 14, marginTop: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  statCard: { 
    width: '46%', 
    backgroundColor: '#2a2a2a', 
    margin: '2%', 
    padding: 20, 
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  statTitle: { color: '#888', fontSize: 14, marginTop: 5 },
  quickActions: { padding: 20 },
  sectionTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2a2a2a', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
  },
  actionIcon: { fontSize: 24, marginRight: 15 },
  actionText: { color: '#fff', fontSize: 16 },
});
