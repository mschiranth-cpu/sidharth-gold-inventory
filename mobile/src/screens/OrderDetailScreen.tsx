import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrder(orderId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      api.updateOrderStatus(orderId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Success', 'Order status updated');
    },
  });

  const order = data?.data;

  if (isLoading || !order) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleStatusUpdate = (newStatus: string) => {
    Alert.alert(
      'Update Status',
      `Change status to ${newStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => updateMutation.mutate({ status: newStatus }) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status?.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.value}>{order.customer?.name || 'N/A'}</Text>
        <Text style={styles.subValue}>{order.customer?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Department</Text>
        <Text style={styles.value}>{order.currentDepartment || 'Not assigned'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {order.statusHistory?.slice(0, 5).map((history: any, idx: number) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>{history.status}</Text>
              <Text style={styles.timelineDate}>
                {new Date(history.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('in_progress')}>
            <Text style={styles.actionText}>In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate('completed')}>
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#FFA500',
    in_progress: '#4169E1',
    completed: '#32CD32',
    on_hold: '#DC143C',
  };
  return colors[status] || '#888';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  loadingText: { color: '#888', textAlign: 'center', marginTop: 50 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 14, textTransform: 'capitalize' },
  section: { padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  sectionTitle: { color: '#888', fontSize: 14, marginBottom: 10 },
  value: { color: '#fff', fontSize: 18 },
  subValue: { color: '#888', fontSize: 14, marginTop: 5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { color: '#fff', fontSize: 16 },
  itemQty: { color: '#D4AF37', fontSize: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 15 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4AF37', marginTop: 5, marginRight: 15 },
  timelineContent: { flex: 1 },
  timelineStatus: { color: '#fff', fontSize: 14, textTransform: 'capitalize' },
  timelineDate: { color: '#666', fontSize: 12, marginTop: 2 },
  actions: { padding: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#000', fontWeight: 'bold' },
});
