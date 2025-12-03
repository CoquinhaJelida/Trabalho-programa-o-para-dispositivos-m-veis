import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Keyboard, Image, Modal, SectionList 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { initialFoods, categories } from '../data/foodList';
import { addCustomFood, getCustomFoods, saveDailyLog, getDayLog, getTodayKey, addMealToDay, deleteMealFromHistory, addXP } from '../services/db';

// RECEBE THEME
export default function MealsScreen({ onGainXP, theme }) {
  // ... (manter estados e lógica iguais) ...
  const [mode, setMode] = useState('list');
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0 });
  const [mealType, setMealType] = useState('breakfast');
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

  // ... (Copie aqui todos os useEffects e funções de lógica do arquivo anterior, eles não mudam) ...
  useEffect(() => { loadData(); guessMealType(); }, []);
  const guessMealType = () => { const hour = new Date().getHours(); if (hour >= 5 && hour < 11) setMealType('breakfast'); else if (hour >= 11 && hour < 15) setMealType('lunch'); else if (hour >= 15 && hour < 19) setMealType('snack'); else setMealType('dinner'); };
  const loadData = () => { getCustomFoods(setCustomFoods); getDayLog(getTodayKey(), (data) => { const meals = data.meals || []; setTodaysMeals(meals); calculateTotals(meals); }); };
  const calculateTotals = (meals) => { const t = meals.reduce((acc, curr) => ({ kcal: acc.kcal + Number(curr.calories), carbs: acc.carbs + Number(curr.carbs || 0), protein: acc.protein + Number(curr.protein || 0), fat: acc.fat + Number(curr.fat || 0), sugar: acc.sugar + Number(curr.sugar || 0), }), { kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0 }); setTotals(t); };
  const saveListToDB = async (newList) => { setTodaysMeals(newList); calculateTotals(newList); const newTotalKcal = newList.reduce((acc, curr) => acc + Number(curr.calories), 0); await saveDailyLog(getTodayKey(), { meals: newList, totalCalories: newTotalKcal }); };
  const groupMealsByType = () => { const groups = { breakfast: { title: 'Café da Manhã', data: [], color: '#f59e0b', icon: 'sun' }, lunch: { title: 'Almoço', data: [], color: '#16a34a', icon: 'map' }, snack: { title: 'Lanche', data: [], color: '#8b5cf6', icon: 'coffee' }, dinner: { title: 'Jantar', data: [], color: '#1e3a8a', icon: 'moon' }, }; todaysMeals.forEach(meal => { const type = meal.mealType || 'snack'; if (groups[type]) groups[type].data.push(meal); }); return Object.values(groups).filter(group => group.data.length > 0); };
  const allFoods = [...initialFoods, ...customFoods.map(f => ({...f, unit_weight: f.unit_weight || 100}))];
  const filteredFoods = allFoods.filter(item => { const matchName = item.name.toLowerCase().includes(searchText.toLowerCase()); const matchCat = selectedCategory === 'all' || item.category === selectedCategory; return matchName && matchCat; });
  const pickImageSource = (setPhotoFunction) => { Alert.alert("Adicionar Foto", "Escolha a origem:", [ { text: "Cancelar", style: "cancel" }, { text: "Galeria", onPress: async () => { const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, aspect: [4, 3] }); if (!res.canceled) setPhotoFunction(res.assets[0].uri); }}, { text: "Câmera", onPress: async () => { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return Alert.alert("Erro", "Sem permissão."); const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, aspect: [4, 3] }); if (!res.canceled) setPhotoFunction(res.assets[0].uri); }}, ]); };
  const handleSelectMealPhoto = () => pickImageSource(setMealPhoto);
  const handleSelectPlatePhoto = () => pickImageSource(setPlatePhoto);
  const deleteMeal = (id) => { Alert.alert("Apagar", "Remover esta refeição?", [ { text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: () => { const updatedList = todaysMeals.filter(m => m.id !== id); saveListToDB(updatedList); }} ]); };
  const createMealObject = () => { if (!selectedItem || !inputValue) { Alert.alert("Erro", "Preencha o valor."); return null; } let multiplier = 0; let weightVal = 0; const isDrink = selectedItem.category === 'Bebida'; const unitLabel = isDrink ? 'ml' : 'g'; if (measureType === 'g') { multiplier = parseFloat(inputValue) / 100; weightVal = parseFloat(inputValue); } else { const unitWeight = selectedItem.unit_weight || 100; multiplier = (unitWeight * parseFloat(inputValue)) / 100; weightVal = Math.round(unitWeight * parseFloat(inputValue)); } return { id: Date.now().toString() + Math.floor(Math.random() * 1000), name: selectedItem.name, calories: Math.round(selectedItem.calories * multiplier), carbs: Math.round((selectedItem.carbs || 0) * multiplier), protein: Math.round((selectedItem.protein || 0) * multiplier), fat: Math.round((selectedItem.fat || 0) * multiplier), sugar: Math.round((selectedItem.sugar || 0) * multiplier), weightVal: weightVal, weight: measureType === 'g' ? `${inputValue}${unitLabel}` : `${inputValue} un (${weightVal}${unitLabel})`, image: mealPhoto, mealType: mealType, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }; };
  const saveDirectly = () => { const newItem = createMealObject(); if (newItem) { if (currentPlate.length > 0) { Alert.alert("Prato em andamento", "Tem itens no prato. Juntar ou salvar só este?", [ { text: "Só este", onPress: () => finalizeSingle(newItem) }, { text: "Juntar", onPress: () => { setCurrentPlate([newItem, ...currentPlate]); setIsPlateMode(true); setInputValue(''); setSelectedItem(null); setSearchText(''); } } ]); } else { finalizeSingle(newItem); } } };
  const addToPlate = () => { const newItem = createMealObject(); if (newItem) { setCurrentPlate([newItem, ...currentPlate]); setIsPlateMode(true); setInputValue(''); setSelectedItem(null); setSearchText(''); setMeasureType('g'); setMealPhoto(null); Keyboard.dismiss(); } };
  const finalizeSingle = (item) => { const updatedList = [item, ...todaysMeals]; saveListToDB(updatedList); finishAndClean(); if(onGainXP) onGainXP(15, "Refeição"); };
  const prepareFinishPlate = () => { if (currentPlate.length === 0) return; if (currentPlate.length === 1) { finalizeSingle(currentPlate[0]); } else { setPlateName(''); setPlatePhoto(null); setPlateModalVisible(true); } };
  const savePlateGroup = () => { if (!plateName.trim()) return Alert.alert("Erro", "Dê um nome."); const totalStats = currentPlate.reduce((acc, curr) => ({ calories: acc.calories + curr.calories, carbs: acc.carbs + curr.carbs, protein: acc.protein + curr.protein, fat: acc.fat + curr.fat, sugar: acc.sugar + curr.sugar, weightVal: acc.weightVal + curr.weightVal, }), { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, weightVal: 0 }); const description = currentPlate.map(i => i.name).join(', '); const finalImage = platePhoto || currentPlate.find(i => i.image)?.image || null; const newGroupMeal = { id: Date.now().toString() + Math.floor(Math.random() * 1000), name: plateName, description: description, calories: totalStats.calories, carbs: totalStats.carbs, protein: totalStats.protein, fat: totalStats.fat, sugar: totalStats.sugar, weight: `${totalStats.weightVal}g (Total)`, image: finalImage, isGroup: true, mealType: mealType, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }; const updatedList = [newGroupMeal, ...todaysMeals]; saveListToDB(updatedList); setPlateModalVisible(false); finishAndClean(); if(onGainXP) onGainXP(20, "Prato Feito"); };
  const finishAndClean = () => { setCurrentPlate([]); setIsPlateMode(false); setPlatePhoto(null); setInputValue(''); setSelectedItem(null); setSearchText(''); setMode('list'); Keyboard.dismiss(); };
  const removeFromPlate = (index) => { const newPlate = [...currentPlate]; newPlate.splice(index, 1); setCurrentPlate(newPlate); if (newPlate.length === 0) setIsPlateMode(false); };
  const handleCreateFood = () => { if (!newName || !newKcal) return Alert.alert("Erro", "Preencha tudo."); let factor = 1; let finalUnitWeight = null; if (createType === 'un') { if (!newUnitWeight) return Alert.alert("Erro", "Informe o peso."); finalUnitWeight = parseFloat(newUnitWeight); factor = 100 / finalUnitWeight; } const macros = { carbs: newCarbs ? parseFloat(newCarbs)*factor:0, protein: newProt ? parseFloat(newProt)*factor:0, fat: newFat ? parseFloat(newFat)*factor:0, sugar: newSugar ? parseFloat(newSugar)*factor:0 }; addCustomFood(newName, parseFloat(newKcal)*factor, newCat, finalUnitWeight, macros, () => { Alert.alert("Sucesso", "Criado!"); setNewName(''); setNewKcal(''); setNewUnitWeight(''); setNewCarbs(''); setNewProt(''); setNewFat(''); setNewSugar(''); setCreateType('100g'); getCustomFoods(setCustomFoods); setMode('search'); if(onGainXP) onGainXP(20, "Criador"); }); };
  const handleClosePanel = () => { setSelectedItem(null); setInputValue(''); setMeasureType('g'); setMealPhoto(null); Keyboard.dismiss(); };
  const plateTotal = currentPlate.reduce((acc, curr) => acc + curr.calories, 0);
  const isSelectedDrink = selectedItem?.category === 'Bebida';
  const isNewDrink = newCat === 'Bebida';
  
  // UI Styles Dinâmicos
  const cardStyle = [styles.card, { backgroundColor: theme.card }];
  const textStyle = { color: theme.text };
  const subTextStyle = { color: theme.textSub };
  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }];

  // Componente interno para usar o tema
  const MealTypeSelector = () => (
    <View style={styles.mealTypeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[{id: 'breakfast', label: 'Café', icon: 'sun'},{id: 'lunch', label: 'Almoço', icon: 'map'}, {id: 'snack', label: 'Lanche', icon: 'coffee'},{id: 'dinner', label: 'Jantar', icon: 'moon'}].map(type => (
          <TouchableOpacity key={type.id} style={[styles.mealTypeBtn, {backgroundColor: theme.inputBg, borderColor: theme.border}, mealType === type.id && styles.mealTypeBtnActive]} onPress={() => setMealType(type.id)}>
            <Feather name={type.icon} size={14} color={mealType === type.id ? '#fff' : theme.textSub} />
            <Text style={[styles.mealTypeText, {color: theme.textSub}, mealType === type.id && styles.mealTypeTextActive]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {mode === 'list' && (
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.summaryCard}>
          <View style={{alignItems: 'center', marginBottom: 10}}><Text style={styles.summaryLabel}>CALORIAS</Text><Text style={styles.summaryValue}>{Math.round(totals.kcal)}</Text></View>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}><Text style={styles.macroLabel}>Carb</Text><Text style={styles.macroValue}>{Math.round(totals.carbs)}g</Text></View><View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Prot</Text><Text style={styles.macroValue}>{Math.round(totals.protein)}g</Text></View><View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Gord</Text><Text style={styles.macroValue}>{Math.round(totals.fat)}g</Text></View><View style={styles.macroDivider} /><View style={styles.macroItem}><Text style={styles.macroLabel}>Açúcar</Text><Text style={[styles.macroValue, {color: '#fca5a5'}]}>{Math.round(totals.sugar)}g</Text></View>
          </View>
        </LinearGradient>
      )}

      {mode === 'list' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.btnAddMain} onPress={() => { setMode('search'); guessMealType(); }}>
            <Feather name="plus-circle" size={24} color="#fff" />
            <Text style={styles.btnTextMain}>Adicionar Refeição</Text>
          </TouchableOpacity>
          <SectionList
            sections={groupMealsByType()} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingBottom: 20 }}
            renderSectionHeader={({ section: { title, color, icon } }) => (
              <View style={styles.sectionHeader}><View style={[styles.sectionIcon, {backgroundColor: color}]}><Feather name={icon} size={14} color="#fff" /></View><Text style={[styles.sectionTitle, {color: color}]}>{title}</Text></View>
            )}
            ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 30 }}><Text style={[styles.emptyText, subTextStyle]}>Nenhuma refeição hoje.</Text></View>}
            renderItem={({ item }) => (
              <View style={[styles.mealItem, {backgroundColor: theme.card}]}>
                <View style={[styles.iconContainer, {backgroundColor: theme.background}]}>{item.image ? <Feather name="camera" size={16} color="#16a34a" /> : <Feather name={item.isGroup ? "layers" : "check-circle"} size={16} color={theme.tabIcon} />}</View>
                <View style={{flex:1}}><Text style={[styles.mealName, textStyle]}>{item.name}</Text>{item.description && <Text style={[styles.mealDesc, subTextStyle]} numberOfLines={1}>{item.description}</Text>}<Text style={[styles.mealDetail, subTextStyle]}>{item.weight} • {item.calories} kcal</Text><Text style={[styles.mealMacros, subTextStyle]}>C:{item.carbs} P:{item.protein} G:{item.fat} <Text style={{color: '#ef4444'}}>Aç:{item.sugar}g</Text></Text></View>
                <TouchableOpacity onPress={() => deleteMeal(item.id)}><Feather name="trash-2" size={20} color="#ef4444" /></TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {mode === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={{paddingVertical: 10, backgroundColor: theme.background}}><Text style={{textAlign:'center', fontSize:12, color: theme.textSub, marginBottom: 5}}>REGISTRANDO EM:</Text><MealTypeSelector /></View>
          {isPlateMode && (
            <View style={[styles.plateHeader, {backgroundColor: theme.card}]}>
              <View style={{flex: 1}}><Text style={[styles.plateTitle, textStyle]}>Montando Prato ({currentPlate.length})</Text><Text style={styles.plateTotal}>{plateTotal} kcal</Text></View>
              <TouchableOpacity style={styles.btnFinish} onPress={prepareFinishPlate}><Text style={styles.btnFinishText}>Finalizar</Text><Feather name="check" size={20} color="#fff" /></TouchableOpacity>
            </View>
          )}
          {isPlateMode && (
            <View style={styles.plateList}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{currentPlate.map((item, index) => (<TouchableOpacity key={index} style={[styles.plateItemChip, {backgroundColor: theme.inputBg}]} onPress={() => removeFromPlate(index)}><Text style={[styles.plateItemText, textStyle]}>{item.name}</Text><Feather name="x" size={14} color={theme.text} style={{marginLeft: 5}} /></TouchableOpacity>))}</ScrollView></View>
          )}
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => { if (isPlateMode) { Alert.alert("Cancelar?", "Sair vai limpar o prato atual.", [{text: "Ficar", style: "cancel"}, {text: "Sair", style: "destructive", onPress: finishAndClean}]); } else { setMode('list'); } }} style={{ padding: 10 }}><Feather name="arrow-left" size={24} color={theme.text} /></TouchableOpacity>
            <TextInput style={inputStyle} placeholder="Buscar..." placeholderTextColor={theme.textSub} value={searchText} onChangeText={setSearchText} autoFocus={!selectedItem} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 50 }}>{categories.map(cat => (<TouchableOpacity key={cat.id} style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive, {borderColor: theme.border, backgroundColor: theme.card}]} onPress={() => setSelectedCategory(cat.id)}><Text style={[styles.catText, selectedCategory === cat.id && { color: '#fff' }, {color: theme.textSub}]}>{cat.name}</Text></TouchableOpacity>))}</ScrollView>
          <FlatList data={filteredFoods} keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()} style={{ flex: 1 }} renderItem={({ item }) => (
            <TouchableOpacity style={[styles.foodRow, selectedItem?.name === item.name && styles.foodRowSelected, {borderBottomColor: theme.border, backgroundColor: theme.card}]} onPress={() => { setSelectedItem(item); setMeasureType(item.unit_weight ? 'un' : 'g'); }}>
              <Text style={[styles.foodName, textStyle]}>{item.name}</Text><Text style={[styles.foodInfo, subTextStyle]}>{Math.round(item.calories)} kcal/100{item.category==='Bebida'?'ml':'g'}</Text>
            </TouchableOpacity>
          )} />
          {selectedItem ? (
            <View style={[styles.bottomPanel, {backgroundColor: theme.card}]}>
              <View style={styles.panelHeader}><Text style={[styles.panelTitle, textStyle]}>{selectedItem.name}</Text><TouchableOpacity onPress={handleClosePanel} style={styles.closeBtn}><Feather name="x" size={24} color={theme.textSub} /></TouchableOpacity></View>
              <View style={[styles.toggleContainer, {backgroundColor: theme.background}]}>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'g' && styles.toggleBtnActive, measureType==='g' && {backgroundColor: theme.inputBg}]} onPress={() => setMeasureType('g')}><Text style={[styles.toggleText, measureType === 'g' && styles.toggleTextActive, {color: theme.textSub}]}>{isSelectedDrink?'ml':'g'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, measureType === 'un' && styles.toggleBtnActive, measureType==='un' && {backgroundColor: theme.inputBg}]} onPress={() => setMeasureType('un')}><Text style={[styles.toggleText, measureType === 'un' && styles.toggleTextActive, {color: theme.textSub}]}>un</Text></TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <TextInput style={[inputStyle, { flex: 1 }]} placeholder={measureType === 'g' ? "Qtd" : "1"} placeholderTextColor={theme.textSub} keyboardType="numeric" value={inputValue} onChangeText={setInputValue} />
                <TouchableOpacity style={[styles.camBtn, {borderColor: theme.border, backgroundColor: theme.background}, mealPhoto && {borderColor: '#16a34a'}]} onPress={handleSelectMealPhoto}>{mealPhoto ? <Image source={{ uri: mealPhoto }} style={{width: 24, height: 24, borderRadius: 4}} /> : <Feather name="camera" size={24} color={theme.textSub} />}</TouchableOpacity>
                <TouchableOpacity style={styles.btnSmall} onPress={saveDirectly}><Text style={{ color: '#fff', fontSize: 12, fontWeight:'bold' }}>Salvar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnConfirm} onPress={addToPlate}><Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Prato</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnCreate} onPress={() => setMode('create')}><Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Não achou? Criar Novo</Text></TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={plateModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.card}]}>
            <Text style={[styles.modalTitle, textStyle]}>Finalizar Prato</Text>
            <TextInput style={inputStyle} placeholder="Ex: Almoço" placeholderTextColor={theme.textSub} value={plateName} onChangeText={setPlateName} autoFocus />
            <TouchableOpacity style={[styles.modalCamBtn, {borderColor: theme.border}, platePhoto && {borderColor: '#16a34a'}]} onPress={handleSelectPlatePhoto}>{platePhoto ? <><Image source={{ uri: platePhoto }} style={styles.modalThumb} /><Text style={[styles.modalCamText, {color: '#16a34a'}]}>Foto registrada!</Text></> : <><Feather name="camera" size={24} color={theme.textSub} /><Text style={[styles.modalCamText, subTextStyle]}>Foto do prato completo</Text></>}</TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPlateModalVisible(false)} style={[styles.btnCancelModal, {backgroundColor: theme.inputBg}]}><Text style={[styles.btnTextCancel, subTextStyle]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={savePlateGroup} style={styles.btnSaveModal}><Text style={styles.btnTextSave}>Salvar Prato</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {mode === 'create' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={cardStyle}>
            <Text style={[styles.cardTitle, textStyle]}>Novo Alimento</Text>
            <TextInput style={inputStyle} placeholder="Nome" placeholderTextColor={theme.textSub} value={newName} onChangeText={setNewName} />
            <View style={[styles.toggleContainer, {backgroundColor: theme.background}]}>
              <TouchableOpacity style={[styles.toggleBtn, createType === '100g' && styles.toggleBtnActive, createType==='100g'&&{backgroundColor: theme.inputBg}]} onPress={() => setCreateType('100g')}><Text style={[styles.toggleText, createType === '100g' && styles.toggleTextActive, {color: theme.textSub}]}>{isNewDrink?'Por 100ml':'Por 100g'}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, createType === 'un' && styles.toggleBtnActive, createType==='un'&&{backgroundColor: theme.inputBg}]} onPress={() => setCreateType('un')}><Text style={[styles.toggleText, createType === 'un' && styles.toggleTextActive, {color: theme.textSub}]}>Por Unidade</Text></TouchableOpacity>
            </View>
            {createType === '100g' ? <><Text style={[styles.label, subTextStyle]}>Calorias (100{isNewDrink?'ml':'g'})</Text><TextInput style={inputStyle} placeholder="Kcal" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /></> : <><Text style={[styles.label, subTextStyle]}>Calorias (1 UN)</Text><TextInput style={inputStyle} placeholder="Kcal" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newKcal} onChangeText={setNewKcal} /><Text style={[styles.label, subTextStyle]}>Peso 1 UN</Text><TextInput style={inputStyle} placeholder="Gramas" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newUnitWeight} onChangeText={setNewUnitWeight} /></>}
            <Text style={[styles.label, subTextStyle]}>Macronutrientes (g)</Text>
            <View style={styles.row3}><TextInput style={[inputStyle, {flex:1}]} placeholder="Carb" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newCarbs} onChangeText={setNewCarbs} /><TextInput style={[inputStyle, {flex:1, marginHorizontal:5}]} placeholder="Prot" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newProt} onChangeText={setNewProt} /><TextInput style={[inputStyle, {flex:1}]} placeholder="Gord" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newFat} onChangeText={setNewFat} /></View>
            <View style={styles.row3}><TextInput style={[inputStyle, {flex:1, borderColor: '#fca5a5'}]} placeholder="Açúcar" placeholderTextColor={theme.textSub} keyboardType="numeric" value={newSugar} onChangeText={setNewSugar} /><View style={{flex: 2}} /></View>
            <View style={styles.catGrid}>{categories.filter(c => c.id !== 'all').map(cat => (<TouchableOpacity key={cat.id} style={[styles.catChipSmall, newCat === cat.id && styles.catChipActive, {borderColor: theme.border, backgroundColor: theme.background}]} onPress={() => setNewCat(cat.id)}><Text style={[styles.catTextSmall, newCat === cat.id && { color: '#fff' }, {color: theme.textSub}]}>{cat.name}</Text></TouchableOpacity>))}</View>
            <View style={styles.btnRow}><TouchableOpacity style={[styles.btnCancel, {backgroundColor: theme.inputBg}]} onPress={() => setMode('search')}><Text style={{color: theme.text}}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.btnSave} onPress={handleCreateFood}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity></View>
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
  mealItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  mealName: { fontSize: 16, fontWeight: '600' },
  mealDesc: { fontSize: 12, marginBottom: 2, fontStyle: 'italic' },
  mealDetail: { fontSize: 14 },
  mealMacros: { fontSize: 10, marginTop: 2 },
  iconContainer: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listThumb: { width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },
  emptyText: { textAlign: 'center', marginTop: 10 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderRadius: 20, marginRight: 8 },
  catChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catText: { fontWeight: '600' },
  foodRow: { padding: 15, borderBottomWidth: 1 },
  foodRowSelected: { backgroundColor: '#e6fffa' },
  foodName: { fontWeight: '600', fontSize: 16 },
  foodInfo: { fontSize: 12 },
  bottomPanel: { padding: 15, borderRadius: 12, elevation: 10, marginTop: 10 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { fontWeight: 'bold', fontSize: 16 },
  closeBtn: { padding: 5 },
  toggleContainer: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { elevation: 2 },
  toggleText: { fontWeight: '600' },
  toggleTextActive: { color: '#16a34a', fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  camBtn: { padding: 12, borderWidth: 1, borderRadius: 8, justifyContent: 'center', width: 50, alignItems: 'center' },
  btnConfirm: { backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  btnSmall: { backgroundColor: '#9ca3af', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 70 },
  btnCreate: { padding: 20, alignItems: 'center', marginTop: 10 },
  card: { padding: 20, borderRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChipSmall: { padding: 8, borderRadius: 8, borderWidth: 1 },
  catTextSmall: { fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 8 },
  btnSave: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 8 },
  row3: { flexDirection: 'row', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { marginBottom: 15 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  btnCancelModal: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnTextCancel: { fontWeight: 'bold' },
  btnSaveModal: { flex: 1, padding: 12, backgroundColor: '#16a34a', borderRadius: 10, alignItems: 'center' },
  btnTextSave: { color: '#fff', fontWeight: 'bold' },
  modalCamBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderRadius: 10, width: '100%', marginBottom: 20 },
  modalCamText: { marginLeft: 10, fontWeight: '600' },
  modalThumb: { width: 30, height: 30, borderRadius: 5 },
  plateHeader: { backgroundColor: '#1f2937', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  plateTitle: { color: '#fff', fontSize: 12, textTransform: 'uppercase' },
  plateTotal: { color: '#22c55e', fontSize: 20, fontWeight: 'bold' },
  btnFinish: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnFinishText: { color: '#fff', fontWeight: 'bold', marginRight: 5 },
  plateList: { marginBottom: 10 },
  plateItemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4b5563', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8 },
  plateItemText: { color: '#fff', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 15 },
  sectionIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  mealTypeContainer: { flexDirection: 'row', paddingHorizontal: 10, marginBottom: 10 },
  mealTypeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  mealTypeBtnActive: { backgroundColor: '#4b5563', borderColor: '#4b5563' },
  mealTypeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  mealTypeTextActive: { color: '#fff' },
});