import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Salvar Histórico Genérico (Serve para Água e Comida)
export const saveHistory = async (key, historyData) => {
  try {
    const jsonValue = JSON.stringify(historyData);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error("Erro ao salvar histórico", e);
  }
};

// Carregar Histórico
export const loadHistory = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (e) {
    console.error("Erro ao carregar histórico", e);
    return {};
  }
};

// Salvar Dado Simples (ex: Peso do usuário)
export const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (e) {
    console.error("Erro ao salvar dado", e);
  }
};

// Ler Dado Simples
export const loadData = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return null;
  }
};