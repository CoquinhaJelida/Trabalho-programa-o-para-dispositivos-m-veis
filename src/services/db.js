import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_FOODS_KEY = '@my_custom_foods';

// Não precisa mais de initDB, o AsyncStorage não precisa inicializar

export const addCustomFood = async (name, calories, category, onSuccess) => {
  try {
    // 1. Pega os existentes
    const existingJSON = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const existingFoods = existingJSON ? JSON.parse(existingJSON) : [];

    // 2. Cria o novo
    const newFood = {
      id: Date.now().toString(), // ID único baseado no tempo
      name,
      calories,
      category,
      isCustom: true
    };

    // 3. Salva a lista atualizada
    const updatedFoods = [...existingFoods, newFood];
    await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updatedFoods));
    
    if (onSuccess) onSuccess(true);
  } catch (e) {
    console.error("Erro ao salvar alimento:", e);
  }
};

export const getCustomFoods = async (onSuccess) => {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
    const foods = json ? JSON.parse(json) : [];
    if (onSuccess) onSuccess(foods);
    return foods;
  } catch (e) {
    console.error("Erro ao buscar alimentos:", e);
    return [];
  }
};