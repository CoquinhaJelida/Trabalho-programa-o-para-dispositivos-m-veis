import * as SQLite from 'expo-sqlite';

// Abre (ou cria) o banco de dados
const db = SQLite.openDatabase('mealtracker_final.db');

export const initDB = () => {
  db.transaction(tx => {
    // Tabela 1: Alimentos Criados pelo Usuário (Para aparecer na busca futura)
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS custom_foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, calories REAL, category TEXT);'
    );
    // Tabela 2: Diário de Alimentação (O que foi comido hoje)
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS meal_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, total_calories REAL, weight TEXT, date TEXT, timestamp INTEGER);'
    );
  });
};

// --- Funções: Alimentos Personalizados ---

export const addCustomFood = (name, caloriesPer100g, category, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO custom_foods (name, calories, category) VALUES (?, ?, ?);',
      [name, caloriesPer100g, category],
      (_, result) => callback(true),
      (_, error) => { console.log(error); callback(false); }
    );
  });
};

export const getCustomFoods = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM custom_foods;',
      [],
      (_, { rows: { _array } }) => callback(_array) // Retorna lista de alimentos criados
    );
  });
};

// --- Funções: Diário (Logs) ---

export const logMeal = (name, totalCalories, weightInfo, date, callback) => {
  const timestamp = Date.now();
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO meal_logs (name, total_calories, weight, date, timestamp) VALUES (?, ?, ?, ?, ?);',
      [name, totalCalories, weightInfo, date, timestamp],
      (_, result) => callback(true),
      (_, error) => { console.log(error); callback(false); }
    );
  });
};

export const getMealsByDate = (date, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM meal_logs WHERE date = ? ORDER BY timestamp DESC;',
      [date],
      (_, { rows: { _array } }) => callback(_array)
    );
  });
};

export const deleteMealLog = (id, callback) => {
  db.transaction(tx => {
    tx.executeSql('DELETE FROM meal_logs WHERE id = ?;', [id], () => callback(true));
  });
};