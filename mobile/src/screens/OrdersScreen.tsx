import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  in_progress: '#4169E1',
  completed: '#32CD32',
  on_hold: '#DC143C',
};

export default function OrdersScreen({ navigation }: any) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => api.getOrders({ status: statusFilter || undefined }),
  });

  const orders = data?.data || [];

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
          <Text style={styles.statusText}>{item.status?.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customer?.name || 'N/A'}</Text>
      <Text style={styles.department}>📍 {item.currentDepartment || 'Not assigned'}</Text>
      <Text style={styles.date}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const FilterButton = ({ label, value }: { label: string; value: string | null }) => (
    <TouchableOpacity
      style={[styles.filterBtn, statusFilter === value && styles.filterBtnActive]}
      onPress={() => setStatusFilter(value)}
    >
      <Text style={[styles.filterText, statusFilter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <FilterButton label="All" value={null} />
        <FilterButton label="Pending" value="pending" />
        <FilterButton label="In Progress" value="in_progress" />
        <FilterButton label="Completed" value="completed" />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  filterRow: { flexDirection: 'row', padding: 10, gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2a2a2a', borderRadius: 20 },
  filterBtnActive: { backgroundColor: '#D4AF37' },
  filterText: { color: '#888', fontSize: 12 },
  filterTextActive: { color: '#000' },
  list: { padding: 10 },
  orderCard: { backgroundColor: '#2a2a2a', padding: 15, borderRadius: 12, marginBottom: 10 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, textTransform: 'capitalize' },
  customerName: { color: '#fff', fontSize: 16, marginTop: 8 },
  department: { color: '#888', fontSize: 14, marginTop: 5 },
  date: { color: '#666', fontSize: 12, marginTop: 5 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 50 },
});
