import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Keyboard, Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { initialFoods, categories } from '../data/foodList';
import { addCustomFood, getCustomFoods, saveDailyLog, getDayLog, getTodayKey } from '../services/db';

export default function MealsScreen() {
  const [mode, setMode] = useState('list');
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [measureType, setMeasureType] = useState('g'); 
  const [mealPhoto, setMealPhoto] = useState(null); // Estado da foto temporária

  const [newName, setNewName] = useState('');
  const [newKcal, setNewKcal] = useState('');
  const [newCat, setNewCat] = useState('Salgada');
  const [createType, setCreateType] = useState('100g'); 
  const [newUnitWeight, setNewUnitWeight] = useState(''); 

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (mode === 'search') {
      getCustomFoods(setCustomFoods);
    }
  }, [mode]);

  const loadData = () => {
    getCustomFoods(setCustomFoods);
    getDayLog(getTodayKey(), (data) => {
      const meals = data.meals || [];
      setTodaysMeals(meals);
      const total = meals.reduce((acc, curr) => acc + Number(curr.calories), 0);
      setTotalCalories(total);
    });
  };

  const persistChanges = async (updatedList) => {
    setTodaysMeals(updatedList);
    const newTotal = updatedList.reduce((acc, curr) => acc + Number(curr.calories), 0);
    setTotalCalories(newTotal);
    await saveDailyLog(getTodayKey(), { meals: updatedList, totalCalories: newTotal });
  };

  const allFoods = [...initialFoods, ...customFoods.map(f => ({...f, unit_weight: f.unit_weight || 100}))];
  
  const filteredFoods = allFoods.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchName && matchCat;
  });

  const handleTakeMealPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Erro", "Permissão negada.");
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setMealPhoto(result.assets[0].uri);
    }
  };

  const handleAddMeal = async () => {
    if (!selectedItem || !inputValue) return Alert.alert("Erro", "Preencha o valor.");
    
    let totalKcal = 0;
    let weightLabel = '';

    if (measureType === 'g') {
      totalKcal = (selectedItem.calories / 100) * parseFloat(inputValue);
      weightLabel = `${inputValue}g`;
    } else {
      const unitWeight = selectedItem.unit_weight || 100;
      totalKcal = (selectedItem.calories / 100) * unitWeight * parseFloat(inputValue);
      weightLabel = `${inputValue} un (${Math.round(unitWeight * parseFloat(inputValue))}g)`;
    }

    const newMeal = {
      id: Date.now().toString(),
      name: selectedItem.name,
      calories: Math.round(totalKcal),
      weight: weightLabel,
      image: mealPhoto, // AQUI ESTÁ A FOTO SENDO SALVA
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newMeal, ...todaysMeals];
    await persistChanges(updated);

    setInputValue('');
    setSelectedItem(null);
    setSearchText('');
    setMeasureType('g');
    setMealPhoto(null);
    setMode('list');
    Keyboard.dismiss();
  };

  const deleteMeal = async (id) => {
    const updated = todaysMeals.filter(m => m.id !== id);
    await persistChanges(updated);
  };

  const handleCreateFood = () => {
    if (!newName || !newKcal) return Alert.alert("Erro", "Preencha tudo.");
    let finalKcalPer100g = parseFloat(newKcal);
    let finalUnitWeight = null;

    if (createType === 'un') {
      if (!newUnitWeight) return Alert.alert("Erro", "Informe o peso.");
      const uWeight = parseFloat(newUnitWeight);
      const uKcal = parseFloat(newKcal); 
      finalKcalPer100g = (uKcal / uWeight) * 100;
      finalUnitWeight = uWeight;
    }

    addCustomFood(newName, finalKcalPer100g, newCat, finalUnitWeight, () => {
      Alert.alert("Sucesso", "Alimento criado!");
      setNewName(''); setNewKcal(''); setNewUnitWeight('');
      setCreateType('100g');
      getCustomFoods(setCustomFoods); 
      setMode('search');
    });
  };

  const handleClosePanel = () => {
    setSelectedItem(null);
    setInputValue('');
    setMeasureType('g');
    setMealPhoto(null);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL DE HOJE</Text>
        <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
        <Text style={styles.summaryUnit}>kcal</Text>
      </LinearGradient>

      {mode === 'list' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.btnAddMain} onPress={() => setMode('search')}>
            <Feather name="plus-circle" size={24} color="#fff" />
            <Text style={styles.btnTextMain}>Registrar Refeição</Text>
          </TouchableOpacity>

          <FlatList
            data={todaysMeals}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 30 }}>
                <Text style={styles.emptyText}>Nenhuma refeição registrada hoje.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.mealItem}>
                
                {/* --- AQUI: MOSTRA A FOTO NA LISTA SE EXISTIR --- */}
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.listThumb} />
                ) : (
                  // Se não tiver foto, mostra um ícone genérico
                  <View style={styles.listIconPlaceholder}>
                    <Feather name="coffee" size={20} color="#16a34a" />
                  </View>
                )}

                <View style={{flex:1}}>
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

      {mode === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setMode('list')} style={{ padding: 10 }}>
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <TextInput style={styles.searchInput} placeholder="Buscar alimento..." value={searchText} onChangeText={setSearchText} autoFocus />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 50 }}>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]} onPress={() => setSelectedCategory(cat.id)}>
                <Text style={[styles.catText, selectedCategory === cat.id && { color: '#fff' }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredFoods}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.foodRow, selectedItem?.name === item.name && styles.foodRowSelected]} onPress={() => {
                setSelectedItem(item);
                setMeasureType(item.unit_weight ? 'un' : 'g');
              }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodInfo}>{Math.round(item.calories)} kcal/100g {item.unit_weight && `• 1 un = ${item.unit_weight}g`}</Text>
              </TouchableOpacity>
            )}
          />

          {selectedItem ? (
            <View style={styles.bottomPanel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>{selectedItem.name}</Text>
                <TouchableOpacity onPress={handleClosePanel} style={styles.closeBtn}><Feather name="x" size={24} color="#999" /></TouchableOpacity>
              </View>
              
              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'g' && styles.toggleBtnActive]} onPress={() => setMeasureType('g')}><Text style={[styles.toggleText, measureType === 'g' && styles.toggleTextActive]}>Gramas (g)</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'un' && styles.toggleBtnActive]} onPress={() => setMeasureType('un')}><Text style={[styles.toggleText, measureType === 'un' && styles.toggleTextActive]}>Unidade (un)</Text></TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder={measureType === 'g' ? "Peso (ex: 200)" : "Qtd (ex: 1.5)"} keyboardType="numeric" value={inputValue} onChangeText={setInputValue} />
                
                {/* BOTÃO CÂMERA */}
                <TouchableOpacity 
                  style={[styles.camBtn, mealPhoto && {backgroundColor: '#dcfce7', borderColor: '#16a34a'}]} 
                  onPress={handleTakeMealPhoto}
                >
                  {mealPhoto ? (
                    // Mostra a foto tirada aqui também
                    <Image source={{ uri: mealPhoto }} style={{width: 30, height: 30, borderRadius: 4}} />
                  ) : (
                    <Feather name="camera" size={24} color={'#666'} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnConfirm} onPress={handleAddMeal}><Text style={{ color: '#fff', fontWeight: 'bold' }}>+</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnCreate} onPress={() => setMode('create')}>
              <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Não achou? Criar Novo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {mode === 'create' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novo Alimento</Text>
            <TextInput style={styles.input} placeholder="Ex: Pastel" value={newName} onChangeText={setNewName} />
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleBtn, createType === '100g' && styles.toggleBtnActive]} onPress={() => setCreateType('100g')}><Text style={[styles.toggleText, createType === '100g' && styles.toggleTextActive]}>Por 100g</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, createType === 'un' && styles.toggleBtnActive]} onPress={() => setCreateType('un')}><Text style={[styles.toggleText, createType === 'un' && styles.toggleTextActive]}>Por Unidade</Text></TouchableOpacity>
            </View>
            {createType === '100g' ? (
              <><Text style={styles.label}>Calorias em 100g</Text><TextInput style={styles.input} placeholder="Ex: 250" keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /></>
            ) : (
              <><Text style={styles.label}>Calorias em 1 UN</Text><TextInput style={styles.input} placeholder="Ex: 300" keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /><Text style={styles.label}>Peso de 1 UN (g)</Text><TextInput style={styles.input} placeholder="Ex: 150" keyboardType="numeric" value={newUnitWeight} onChangeText={setNewUnitWeight} /></>
            )}
            <View style={styles.catGrid}>{categories.filter(c => c.id !== 'all').map(cat => (<TouchableOpacity key={cat.id} style={[styles.catChipSmall, newCat === cat.id && styles.catChipActive]} onPress={() => setNewCat(cat.id)}><Text style={[styles.catTextSmall, newCat === cat.id && { color: '#fff' }]}>{cat.name}</Text></TouchableOpacity>))}</View>
            <View style={styles.btnRow}><TouchableOpacity style={styles.btnCancel} onPress={() => setMode('search')}><Text>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.btnSave} onPress={handleCreateFood}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity></View>
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
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  mealName: { fontSize: 16, fontWeight: '600', color: '#333' },
  mealDetail: { color: '#666', fontSize: 14 },
  
  // ESTILO DA FOTO NA LISTA
  listThumb: { width: 50, height: 50, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  listIconPlaceholder: { width: 50, height: 50, borderRadius: 8, marginRight: 15, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },

  emptyText: { textAlign: 'center', color: '#999', marginTop: 10 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, marginRight: 8 },
  catChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catText: { color: '#666', fontWeight: '600' },
  foodRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  foodRowSelected: { backgroundColor: '#e6fffa' },
  foodName: { fontWeight: '600', fontSize: 16, color: '#333' },
  foodInfo: { color: '#888', fontSize: 12 },
  bottomPanel: { backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 10, marginTop: 10 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { fontWeight: 'bold', color: '#16a34a', fontSize: 16 },
  closeBtn: { padding: 5 },
  toggleContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { color: '#666', fontWeight: '600' },
  toggleTextActive: { color: '#16a34a', fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff', marginBottom: 10 },
  camBtn: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#f9f9f9', justifyContent: 'center', width: 50, alignItems: 'center' },
  btnConfirm: { backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  btnCreate: { padding: 20, alignItems: 'center', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChipSmall: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  catTextSmall: { fontSize: 12, color: '#666' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  btnSave: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 8 },
});