import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSync = async () => {
    try {
      await api.syncOfflineQueue();
      Alert.alert('Sync Complete', 'All offline data has been synced.');
    } catch {
      Alert.alert('Sync Failed', 'Could not sync offline data.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department || 'Not assigned'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleSync}>
          <Text style={styles.menuText}>🔄 Sync Offline Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🔔 Notification Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>ℹ️ About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  profileHeader: { alignItems: 'center', paddingVertical: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: '#000', fontWeight: 'bold' },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  userEmail: { color: '#888', fontSize: 14, marginTop: 5 },
  roleBadge: { backgroundColor: '#2a2a2a', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  roleText: { color: '#D4AF37', textTransform: 'capitalize' },
  section: { padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  sectionTitle: { color: '#888', fontSize: 14, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { color: '#888' },
  infoValue: { color: '#fff' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  menuText: { color: '#fff', fontSize: 16 },
  logoutBtn: { margin: 20, backgroundColor: '#DC143C', padding: 15, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  version: { color: '#666', textAlign: 'center', marginBottom: 30 },
});
