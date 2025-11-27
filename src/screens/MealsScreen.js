import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Keyboard 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Dados Estáticos
import { initialFoods, categories } from '../data/foodList';
// Serviço Novo (sem SQLite)
import { addCustomFood, getCustomFoods } from '../services/db';

export default function MealsScreen() {
  const [mode, setMode] = useState('list');
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  
  // Filtros
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Inputs
  const [selectedItem, setSelectedItem] = useState(null);
  const [weight, setWeight] = useState('');

  // Novo Alimento
  const [newName, setNewName] = useState('');
  const [newKcal, setNewKcal] = useState('');
  const [newCat, setNewCat] = useState('Salgada');

  useEffect(() => {
    loadCustomList();
  }, []);

  const loadCustomList = () => {
    // Agora busca do AsyncStorage
    getCustomFoods((items) => {
      setCustomFoods(items);
    });
  };

  // Junta alimentos fixos + personalizados
  const allFoods = [...initialFoods, ...customFoods];
  
  const filteredFoods = allFoods.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchName && matchCat;
  });

  const handleAddMeal = () => {
    if (!selectedItem || !weight) return Alert.alert("Erro", "Selecione o alimento e o peso.");
    
    const totalKcal = (selectedItem.calories / 100) * parseFloat(weight);

    const newMeal = {
      id: Date.now().toString(),
      name: selectedItem.name,
      calories: Math.round(totalKcal),
      weight: `${weight}g`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setTodaysMeals([...todaysMeals, newMeal]);
    setWeight('');
    setSelectedItem(null);
    setSearchText('');
    setMode('list');
    Keyboard.dismiss();
  };

  const handleCreateFood = () => {
    if (!newName || !newKcal) return Alert.alert("Erro", "Preencha nome e calorias.");

    // Salva no AsyncStorage
    addCustomFood(newName, parseFloat(newKcal), newCat, () => {
      Alert.alert("Sucesso", "Alimento salvo!");
      setNewName('');
      setNewKcal('');
      loadCustomList(); // Recarrega a lista
      setMode('search'); // Volta para a busca
    });
  };

  const deleteMeal = (id) => {
    setTodaysMeals(todaysMeals.filter(m => m.id !== id));
  };

  const totalCalories = todaysMeals.reduce((acc, curr) => acc + curr.calories, 0);

  return (
    <View style={styles.container}>
      {/* Cabeçalho de Calorias */}
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL DE HOJE</Text>
        <Text style={styles.summaryValue}>{totalCalories}</Text>
        <Text style={styles.summaryUnit}>kcal</Text>
      </LinearGradient>

      {/* MODO LISTA (Tela Principal) */}
      {mode === 'list' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.btnAddMain} onPress={() => setMode('search')}>
            <Feather name="plus-circle" size={24} color="#fff" />
            <Text style={styles.btnTextMain}>Registrar Refeição</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Refeições Consumidas</Text>
          <FlatList
            data={todaysMeals}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Nada registrado hoje.</Text>}
            renderItem={({ item }) => (
              <View style={styles.mealItem}>
                <View>
                  <Text style={styles.mealName}>{item.name}</Text>
                  <Text style={styles.mealDetail}>{item.weight} • {item.calories} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => deleteMeal(item.id)}>
                  <Feather name="trash-2" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* MODO BUSCA (Selecionar Alimento) */}
      {mode === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setMode('list')} style={{ padding: 10 }}>
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar (ex: Arroz)" 
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>

          <View style={{ height: 50 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.catText, selectedCategory === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredFoods}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.foodRow, selectedItem?.name === item.name && styles.foodRowSelected]} 
                onPress={() => setSelectedItem(item)}
              >
                <View>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodInfo}>{item.category} • {item.calories} kcal/100g</Text>
                </View>
                {selectedItem?.name === item.name && <Feather name="check" size={20} color="#16a34a" />}
              </TouchableOpacity>
            )}
          />

          {selectedItem ? (
            <View style={styles.bottomPanel}>
              <Text style={styles.panelTitle}>Selecionado: {selectedItem.name}</Text>
              <View style={styles.inputRow}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Peso (g)" 
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
                <TouchableOpacity style={styles.btnConfirm} onPress={handleAddMeal}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnCreate} onPress={() => setMode('create')}>
              <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Não achou? Cadastrar Novo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MODO CRIAR (Novo Alimento) */}
      {mode === 'create' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cadastrar Novo Alimento</Text>
            <Text style={styles.helper}>Isso ficará salvo na sua lista.</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} placeholder="Ex: Torta" value={newName} onChangeText={setNewName} />

            <Text style={styles.label}>Calorias (em 100g)</Text>
            <TextInput style={styles.input} placeholder="Ex: 250" keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.catGrid}>
              {categories.filter(c => c.id !== 'all').map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catChipSmall, newCat === cat.id && styles.catChipActive]}
                  onPress={() => setNewCat(cat.id)}
                >
                  <Text style={[styles.catTextSmall, newCat === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setMode('search')}>
                <Text style={{ color: '#666' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleCreateFood}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4 },
  summaryLabel: { color: '#dcfce7', fontSize: 12, fontWeight: 'bold' },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  summaryUnit: { color: '#dcfce7' },
  btnAddMain: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, marginBottom: 20 },
  btnTextMain: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  mealName: { fontSize: 16, fontWeight: '600', color: '#333' },
  mealDetail: { color: '#666', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, marginRight: 8 },
  catChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catText: { color: '#666', fontWeight: '600' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  foodRowSelected: { backgroundColor: '#e6fffa' },
  foodName: { fontWeight: '600', fontSize: 16, color: '#333' },
  foodInfo: { color: '#888', fontSize: 12 },
  bottomPanel: { backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 10, marginTop: 10 },
  panelTitle: { fontWeight: 'bold', color: '#16a34a', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  btnConfirm: { backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnCreate: { padding: 20, alignItems: 'center', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  helper: { color: '#888', fontSize: 12, marginBottom: 20 },
  label: { marginBottom: 5, fontWeight: '600', color: '#333' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChipSmall: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  catTextSmall: { fontSize: 12, color: '#666' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  btnSave: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 8 },
});