import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Header() {
  return (
    <LinearGradient
      colors={['#16a34a', '#15803d']}
      style={styles.header}
    >
      <Text style={styles.headerTitle}>Nutrição Diária</Text>
      <Text style={styles.headerSubtitle}>Monitore sua saúde</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#dcfce7',
    textAlign: 'center',
    marginTop: 4,
  },
});