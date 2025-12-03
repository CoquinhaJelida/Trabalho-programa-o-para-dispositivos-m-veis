import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function Header({ onProfileClick, toggleTheme, isDarkMode, theme }) {
  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#16a34a', '#15803d']}
      style={styles.header}
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.headerTitle}>NutriLife</Text>
          <Text style={styles.headerSubtitle}>Monitore sua saúde</Text>
        </View>

        <View style={{flexDirection: 'row', gap: 10}}>
          {/* Botão de Tema */}
          <TouchableOpacity style={[styles.iconButton, {backgroundColor: theme.card}]} onPress={toggleTheme}>
            <Feather name={isDarkMode ? "sun" : "moon"} size={20} color={theme.text} />
          </TouchableOpacity>

          {/* Botão de Perfil */}
          <TouchableOpacity style={[styles.iconButton, {backgroundColor: theme.card}]} onPress={onProfileClick}>
            <Feather name="user" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 24,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  }
});