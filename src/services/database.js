// src/services/database.js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('mealtracker.db');

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS custom_foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, calories REAL, category TEXT);'
    );
  });
};

export const addCustomFood = (name, calories, category, callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO custom_foods (name, calories, category) VALUES (?, ?, ?);',
      [name, calories, category],
      (_, result) => callback(result),
      (_, error) => console.log('Erro ao inserir:', error)
    );
  });
};

export const getCustomFoods = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM custom_foods;',
      [],
      (_, { rows: { _array } }) => callback(_array),
      (_, error) => console.log('Erro ao buscar:', error)
    );
  });
};