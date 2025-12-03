import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function Header({ onProfileClick }) {
  return (
    <LinearGradient
      colors={['#16a34a', '#15803d']}
      style={styles.header}
    >
      <View style={styles.row}>
        {/* Textos do Título */}
        <View>
          <Text style={styles.headerTitle}>Nutrição Diária</Text>
          <Text style={styles.headerSubtitle}>Monitore sua saúde</Text>
        </View>

        {/* Botão de Perfil (Bolinha) */}
        <TouchableOpacity style={styles.profileButton} onPress={onProfileClick}>
          <Feather name="user" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 24, // Ajuste para a barra de status
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    color: '#dcfce7',
    marginTop: 4,
    fontSize: 14,
  },
  // Estilo da Bolinha de Perfil
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  }
});