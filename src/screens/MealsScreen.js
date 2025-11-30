import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Keyboard, Image, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { initialFoods, categories } from '../data/foodList';
import { addCustomFood, getCustomFoods, saveDailyLog, getDayLog, getTodayKey, addMealToDay, deleteMealFromHistory } from '../services/db';

export default function MealsScreen() {
  const [mode, setMode] = useState('list');
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0 });
  
  // Prato em Montagem
  const [currentPlate, setCurrentPlate] = useState([]); 
  const [isPlateMode, setIsPlateMode] = useState(false);
  const [plateModalVisible, setPlateModalVisible] = useState(false);
  const [plateName, setPlateName] = useState('');
  const [platePhoto, setPlatePhoto] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [measureType, setMeasureType] = useState('g'); 
  const [mealPhoto, setMealPhoto] = useState(null);

  const [newName, setNewName] = useState('');
  const [newKcal, setNewKcal] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProt, setNewProt] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newSugar, setNewSugar] = useState('');
  const [newCat, setNewCat] = useState('Salgada');
  const [createType, setCreateType] = useState('100g'); 
  const [newUnitWeight, setNewUnitWeight] = useState(''); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getCustomFoods(setCustomFoods);
    getDayLog(getTodayKey(), (data) => {
      const meals = data.meals || [];
      setTodaysMeals(meals);
      calculateTotals(meals);
    });
  };

  const calculateTotals = (meals) => {
    const t = meals.reduce((acc, curr) => ({
      kcal: acc.kcal + Number(curr.calories),
      carbs: acc.carbs + Number(curr.carbs || 0),
      protein: acc.protein + Number(curr.protein || 0),
      fat: acc.fat + Number(curr.fat || 0),
      sugar: acc.sugar + Number(curr.sugar || 0),
    }), { kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0 });
    setTotals(t);
    return t;
  };

  const allFoods = [
    ...initialFoods, 
    ...customFoods.map(f => ({...f, unit_weight: f.unit_weight || 100}))
  ];
  
  const filteredFoods = allFoods.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchName && matchCat;
  });

  const handleTakeMealPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Erro", "Permissão negada.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setMealPhoto(result.assets[0].uri);
  };

  const handleTakePlatePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Erro", "Permissão negada.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setPlatePhoto(result.assets[0].uri);
  };

  const handleAddItem = () => {
    if (!selectedItem || !inputValue) return Alert.alert("Erro", "Preencha o valor.");
    
    let multiplier = 0;
    let weightVal = 0;
    
    // --- CORREÇÃO AQUI: DETECTA SE É BEBIDA ---
    const isDrink = selectedItem.category === 'Bebida';
    const unitLabel = isDrink ? 'ml' : 'g';

    if (measureType === 'g') {
      multiplier = parseFloat(inputValue) / 100;
      weightVal = parseFloat(inputValue);
    } else {
      const unitWeight = selectedItem.unit_weight || 100;
      multiplier = (unitWeight * parseFloat(inputValue)) / 100;
      weightVal = Math.round(unitWeight * parseFloat(inputValue));
    }

    const newItem = {
      id: Date.now().toString() + Math.random(),
      name: selectedItem.name,
      calories: Math.round(selectedItem.calories * multiplier),
      carbs: Math.round((selectedItem.carbs || 0) * multiplier),
      protein: Math.round((selectedItem.protein || 0) * multiplier),
      fat: Math.round((selectedItem.fat || 0) * multiplier),
      sugar: Math.round((selectedItem.sugar || 0) * multiplier),
      weightVal: weightVal,
      weightLabel: `${weightVal}${unitLabel}`, // Usa ml ou g
      image: mealPhoto,
    };

    setCurrentPlate([...currentPlate, newItem]);
    setIsPlateMode(true);

    setInputValue(''); setSelectedItem(null); setSearchText(''); setMeasureType('g'); setMealPhoto(null);
    Keyboard.dismiss();
  };

  const prepareFinishPlate = () => {
    if (currentPlate.length === 0) return;
    if (currentPlate.length === 1) {
      saveSingleItem(currentPlate[0]);
    } else {
      setPlateName(''); 
      setPlatePhoto(null);
      setPlateModalVisible(true);
    }
  };

  const saveSingleItem = (item) => {
    const newMeal = {
      ...item,
      id: Date.now().toString() + Math.random(),
      weight: item.weightLabel,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    addMealToDay(newMeal, (updatedList, newTotal) => {
      setTodaysMeals(updatedList);
      calculateTotals(updatedList);
      finishAndClean();
    });
  };

  const savePlateGroup = () => {
    if (!plateName.trim()) {
      Alert.alert("Nome vazio", "Dê um nome para seu prato.");
      return;
    }

    const totalStats = currentPlate.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      carbs: acc.carbs + curr.carbs,
      protein: acc.protein + curr.protein,
      fat: acc.fat + curr.fat,
      sugar: acc.sugar + curr.sugar,
      weightVal: acc.weightVal + curr.weightVal,
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, weightVal: 0 });

    const description = currentPlate.map(i => i.name).join(', ');
    const finalImage = platePhoto || currentPlate.find(i => i.image)?.image || null;

    const newGroupMeal = {
      id: Date.now().toString() + Math.random(),
      name: plateName,
      description: description,
      calories: totalStats.calories,
      carbs: totalStats.carbs,
      protein: totalStats.protein,
      fat: totalStats.fat,
      sugar: totalStats.sugar,
      weight: `${totalStats.weightVal}g (Total)`,
      image: finalImage,
      isGroup: true,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    addMealToDay(newGroupMeal, (updatedList, newTotal) => {
      setTodaysMeals(updatedList);
      calculateTotals(updatedList);
      setPlateModalVisible(false);
      finishAndClean();
    });
  };

  const finishAndClean = () => {
    setCurrentPlate([]);
    setIsPlateMode(false);
    setPlatePhoto(null);
    setMode('list');
  };

  const removeFromPlate = (index) => {
    const newPlate = [...currentPlate];
    newPlate.splice(index, 1);
    setCurrentPlate(newPlate);
    if (newPlate.length === 0) setIsPlateMode(false);
  };

  const deleteMeal = (id) => {
    deleteMealFromHistory(id, (updatedList, newTotal) => {
      setTodaysMeals(updatedList);
      calculateTotals(updatedList);
    });
  };

  const handleCreateFood = () => {
    if (!newName || !newKcal) return Alert.alert("Erro", "Preencha nome e calorias.");
    let factor = 1; let finalUnitWeight = null;
    if (createType === 'un') {
      if (!newUnitWeight) return Alert.alert("Erro", "Informe o peso.");
      finalUnitWeight = parseFloat(newUnitWeight); factor = 100 / finalUnitWeight;
    }
    const macros = { carbs: newCarbs ? parseFloat(newCarbs)*factor:0, protein: newProt ? parseFloat(newProt)*factor:0, fat: newFat ? parseFloat(newFat)*factor:0, sugar: newSugar ? parseFloat(newSugar)*factor:0 };
    addCustomFood(newName, parseFloat(newKcal)*factor, newCat, finalUnitWeight, macros, () => {
      Alert.alert("Sucesso", "Criado!"); setNewName(''); setNewKcal(''); setNewUnitWeight(''); setNewCarbs(''); setNewProt(''); setNewFat(''); setNewSugar(''); setCreateType('100g');
      getCustomFoods(setCustomFoods); setMode('search');
    });
  };

  const handleClosePanel = () => { setSelectedItem(null); setInputValue(''); setMeasureType('g'); setMealPhoto(null); Keyboard.dismiss(); };
  const plateTotal = currentPlate.reduce((acc, curr) => acc + curr.calories, 0);

  // --- CHECAGEM SE É BEBIDA ---
  const isSelectedDrink = selectedItem?.category === 'Bebida';
  const isNewDrink = newCat === 'Bebida';

  return (
    <View style={styles.container}>
      {mode === 'list' && (
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
          <View style={{alignItems: 'center', marginBottom: 10}}>
            <Text style={styles.summaryLabel}>CALORIAS</Text>
            <Text style={styles.summaryValue}>{Math.round(totals.kcal)}</Text>
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}><Text style={styles.macroLabel}>Carb</Text><Text style={styles.macroValue}>{Math.round(totals.carbs)}g</Text></View>
            <View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Prot</Text><Text style={styles.macroValue}>{Math.round(totals.protein)}g</Text></View>
            <View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Gord</Text><Text style={styles.macroValue}>{Math.round(totals.fat)}g</Text></View>
            <View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Açúcar</Text><Text style={[styles.macroValue, {color: '#fca5a5'}]}>{Math.round(totals.sugar)}g</Text></View>
          </View>
        </LinearGradient>
      )}

      {mode === 'list' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.btnAddMain} onPress={() => setMode('search')}>
            <Feather name="plus-circle" size={24} color="#fff" />
            <Text style={styles.btnTextMain}>Montar Refeição</Text>
          </TouchableOpacity>
          <FlatList
            data={todaysMeals}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 30 }}><Text style={styles.emptyText}>Nenhuma refeição registrada hoje.</Text></View>}
            renderItem={({ item }) => (
              <View style={styles.mealItem}>
                <View style={styles.iconContainer}>
                   {item.image ? <Feather name="camera" size={16} color="#16a34a" /> : <Feather name={item.isGroup ? "layers" : "check-circle"} size={16} color="#ddd" />}
                </View>
                <View style={{flex:1}}>
                  <Text style={styles.mealName}>{item.name}</Text>
                  {item.description && <Text style={styles.mealDesc} numberOfLines={1}>{item.description}</Text>}
                  <Text style={styles.mealDetail}>{item.weight} • {item.calories} kcal</Text>
                  <Text style={styles.mealMacros}>C:{item.carbs} P:{item.protein} G:{item.fat} <Text style={{color: '#ef4444'}}>Aç:{item.sugar}g</Text></Text>
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
          {isPlateMode && (
            <View style={styles.plateHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.plateTitle}>Montando Prato ({currentPlate.length} itens)</Text>
                <Text style={styles.plateTotal}>{plateTotal} kcal</Text>
              </View>
              <TouchableOpacity style={styles.btnFinish} onPress={prepareFinishPlate}>
                <Text style={styles.btnFinishText}>Finalizar</Text>
                <Feather name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {isPlateMode && (
            <View style={styles.plateList}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {currentPlate.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.plateItemChip} onPress={() => removeFromPlate(index)}>
                    <Text style={styles.plateItemText}>{item.name}</Text>
                    <Feather name="x" size={14} color="#fff" style={{marginLeft: 5}} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => {
              if (isPlateMode) {
                Alert.alert("Cancelar?", "Sair vai limpar o prato atual.", [{text: "Ficar", style: "cancel"}, {text: "Sair", style: "destructive", onPress: () => { setCurrentPlate([]); setIsPlateMode(false); setMode('list'); }}]);
              } else { setMode('list'); }
            }} style={{ padding: 10 }}><Feather name="arrow-left" size={24} color="#333" /></TouchableOpacity>
            <TextInput style={styles.searchInput} placeholder="Buscar..." value={searchText} onChangeText={setSearchText} autoFocus={!selectedItem} placeholderTextColor="#9ca3af" />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 50 }}>
            {categories.map(cat => (<TouchableOpacity key={cat.id} style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]} onPress={() => setSelectedCategory(cat.id)}><Text style={[styles.catText, selectedCategory === cat.id && { color: '#fff' }]}>{cat.name}</Text></TouchableOpacity>))}
          </ScrollView>

          <FlatList
            data={filteredFoods}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.foodRow, selectedItem?.name === item.name && styles.foodRowSelected]} onPress={() => { setSelectedItem(item); setMeasureType(item.unit_weight ? 'un' : 'g'); }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodInfo}>{Math.round(item.calories)} kcal/100{item.category === 'Bebida' ? 'ml' : 'g'}</Text>
              </TouchableOpacity>
            )}
          />

          {selectedItem ? (
            <View style={styles.bottomPanel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>{selectedItem.name}</Text>
                <TouchableOpacity onPress={handleClosePanel} style={styles.closeBtn}><Feather name="x" size={24} color="#999" /></TouchableOpacity>
              </View>
              
              {/* --- SELETOR DE MEDIDA DINÂMICO --- */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'g' && styles.toggleBtnActive]} onPress={() => setMeasureType('g')}>
                  <Text style={[styles.toggleText, measureType === 'g' && styles.toggleTextActive]}>
                    {isSelectedDrink ? 'Mililitros (ml)' : 'Gramas (g)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'un' && styles.toggleBtnActive]} onPress={() => setMeasureType('un')}>
                  <Text style={[styles.toggleText, measureType === 'un' && styles.toggleTextActive]}>Unidade (un)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder={measureType === 'g' ? (isSelectedDrink ? "Vol" : "Peso") : "Qtd"} 
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric" 
                  value={inputValue} 
                  onChangeText={setInputValue} 
                />
                <TouchableOpacity style={[styles.camBtn, mealPhoto && {backgroundColor: '#dcfce7', borderColor: '#16a34a'}]} onPress={handleTakeMealPhoto}>
                  {mealPhoto ? <Image source={{ uri: mealPhoto }} style={{width: 24, height: 24, borderRadius: 4}} /> : <Feather name="camera" size={24} color={mealPhoto ? '#16a34a' : '#666'} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnConfirm} onPress={handleAddItem}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Adicionar +</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnCreate} onPress={() => setMode('create')}>
              <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Não achou? Criar Novo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={plateModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalizar Prato</Text>
            <Text style={styles.modalSub}>Dê um nome para sua refeição.</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Almoço" placeholderTextColor="#9ca3af" value={plateName} onChangeText={setPlateName} autoFocus />
            <TouchableOpacity style={[styles.modalCamBtn, platePhoto && {backgroundColor: '#dcfce7', borderColor: '#16a34a'}]} onPress={handleTakePlatePhoto}>
              {platePhoto ? <><Image source={{ uri: platePhoto }} style={styles.modalThumb} /><Text style={[styles.modalCamText, {color: '#16a34a'}]}>Foto registrada!</Text></> : <><Feather name="camera" size={24} color="#666" /><Text style={styles.modalCamText}>Foto do prato completo (Opcional)</Text></>}
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPlateModalVisible(false)} style={styles.btnCancelModal}><Text style={styles.btnTextCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={savePlateGroup} style={styles.btnSaveModal}><Text style={styles.btnTextSave}>Salvar Prato</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {mode === 'create' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novo Alimento</Text>
            <TextInput style={styles.input} placeholder="Nome (ex: Pizza)" placeholderTextColor="#9ca3af" value={newName} onChangeText={setNewName} />
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleBtn, createType === '100g' && styles.toggleBtnActive]} onPress={() => setCreateType('100g')}>
                <Text style={[styles.toggleText, createType === '100g' && styles.toggleTextActive]}>
                  {isNewDrink ? 'Por 100ml' : 'Por 100g'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, createType === 'un' && styles.toggleBtnActive]} onPress={() => setCreateType('un')}><Text style={[styles.toggleText, createType === 'un' && styles.toggleTextActive]}>Por Unidade</Text></TouchableOpacity>
            </View>

            {createType === '100g' ? (
              <><Text style={styles.label}>Calorias (100{isNewDrink?'ml':'g'})</Text><TextInput style={styles.input} placeholder="Kcal" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /></>
            ) : (
              <><Text style={styles.label}>Calorias (1 UN)</Text><TextInput style={styles.input} placeholder="Kcal" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /><Text style={styles.label}>Peso de 1 UN ({isNewDrink?'ml':'g'})</Text><TextInput style={styles.input} placeholder={isNewDrink?"ml":"g"} placeholderTextColor="#9ca3af" keyboardType="numeric" value={newUnitWeight} onChangeText={setNewUnitWeight} /></>
            )}
            
            <Text style={styles.label}>Macronutrientes (g)</Text>
            <View style={styles.row3}>
              <TextInput style={[styles.input, {flex:1}]} placeholder="Carb" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newCarbs} onChangeText={setNewCarbs} />
              <TextInput style={[styles.input, {flex:1, marginHorizontal:5}]} placeholder="Prot" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newProt} onChangeText={setNewProt} />
              <TextInput style={[styles.input, {flex:1}]} placeholder="Gord" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newFat} onChangeText={setNewFat} />
            </View>
            <View style={styles.row3}>
               <TextInput style={[styles.input, {flex:1, borderColor: '#fca5a5'}]} placeholder="Açúcar" placeholderTextColor="#9ca3af" keyboardType="numeric" value={newSugar} onChangeText={setNewSugar} />
               <View style={{flex: 2}} />
            </View>
            
            {/* SELEÇÃO DE CATEGORIA PARA MUDAR OS RÓTULOS */}
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
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  macroItem: { alignItems: 'center' },
  macroLabel: { color: '#dcfce7', fontSize: 10, fontWeight: 'bold' },
  macroValue: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  macroDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  btnAddMain: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, marginBottom: 20 },
  btnTextMain: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  mealName: { fontSize: 16, fontWeight: '600', color: '#333' },
  mealDesc: { fontSize: 12, color: '#666', marginBottom: 2, fontStyle: 'italic' },
  mealDetail: { color: '#666', fontSize: 14 },
  mealMacros: { color: '#888', fontSize: 10, marginTop: 2 },
  iconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listThumb: { width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },
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
  row3: { flexDirection: 'row', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSub: { color: '#666', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  btnCancelModal: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnTextCancel: { color: '#666', fontWeight: 'bold' },
  btnSaveModal: { flex: 1, padding: 12, backgroundColor: '#16a34a', borderRadius: 10, alignItems: 'center' },
  btnTextSave: { color: '#fff', fontWeight: 'bold' },
  modalCamBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, width: '100%', marginBottom: 20 },
  modalCamText: { marginLeft: 10, color: '#666', fontWeight: '600' },
  modalThumb: { width: 30, height: 30, borderRadius: 5 },
  plateHeader: { backgroundColor: '#1f2937', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  plateTitle: { color: '#fff', fontSize: 12, textTransform: 'uppercase' },
  plateTotal: { color: '#22c55e', fontSize: 20, fontWeight: 'bold' },
  btnFinish: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnFinishText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
  plateList: { marginBottom: 10 },
  plateItemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4b5563', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8 },
  plateItemText: { color: '#fff', fontSize: 12 },
});