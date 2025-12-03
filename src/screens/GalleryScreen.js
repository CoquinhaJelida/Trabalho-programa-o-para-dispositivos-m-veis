import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Modal, TextInput, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { savePhotoLog, getGallery, deletePhoto, getTodayKey, getProfile, getHistory, deleteMealFromHistory } from '../services/db';

const { width } = Dimensions.get('window');

export default function GalleryScreen() {
  const [activeTab, setActiveTab] = useState('body'); 
  const [gallery, setGallery] = useState({});
  const [mealHistory, setMealHistory] = useState({});
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [compareImage, setCompareImage] = useState(null);
  const [isPickingCompare, setIsPickingCompare] = useState(false);
  // Mudei o padrão para 'cover' para preencher melhor a metade da tela
  const [resizeMode, setResizeMode] = useState('cover'); 

  const [modalVisible, setModalVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  
  // Medidas
  const [waistInput, setWaistInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [armInput, setArmInput] = useState('');
  const [hipInput, setHipInput] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    getGallery(setGallery);
    getHistory(setMealHistory);
  };

  const prepareInputs = () => {
    getProfile((data) => {
      if (data && data.weight) setWeightInput(data.weight);
      else setWeightInput('');
      setWaistInput(''); setChestInput(''); setArmInput(''); setHipInput('');
    });
  };

  const handleAddBodyPhoto = async () => {
    Alert.alert("Nova Foto", "Escolha a origem:", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => pickImage('gallery') },
      { text: "Câmera", onPress: () => pickImage('camera') },
    ]);
  };

  const pickImage = async (type) => {
    let result;
    // Mudamos aspect para [3, 4] para ficar ligeiramente mais alto, melhor para corpo
    const options = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [3, 4] };
    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Erro", "Sem permissão.");
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled) {
      setTempPhotoUri(result.assets[0].uri);
      prepareInputs();
      setModalVisible(true);
    }
  };

  const saveFinalBodyPhoto = async () => {
    if (tempPhotoUri) {
      const today = getTodayKey();
      const measurements = { waist: waistInput, chest: chestInput, arm: armInput, hips: hipInput };
      await savePhotoLog(today, tempPhotoUri, weightInput, measurements);
      setModalVisible(false);
      setTempPhotoUri(null);
      loadData();
    }
  };

  const handleDeleteCurrent = () => {
    if (!selectedImage) return;
    Alert.alert("Excluir", selectedImage.type === 'meal' ? "Apagar refeição?" : "Apagar foto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: async () => {
          if (selectedImage.type === 'body') await deletePhoto(selectedImage.date, selectedImage.id, setGallery);
          else await deleteMealFromHistory(selectedImage.date, selectedImage.id, () => getHistory(setMealHistory));
          handleCloseZoom();
        } 
      }
    ]);
  };

  const handleCloseZoom = () => { setSelectedImage(null); setCompareImage(null); setIsPickingCompare(false); setResizeMode('cover'); };
  const toggleResizeMode = () => { setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain'); };
  const formatDate = (dateStr) => dateStr.split('-').reverse().join('/');

  const getAllBodyPhotos = () => {
    const allPhotos = [];
    Object.keys(gallery).sort().reverse().forEach(date => {
      gallery[date].forEach(photo => { allPhotos.push({ ...photo, date }); });
    });
    return allPhotos;
  };

  // COMPONENTE: DADOS NA COMPARAÇÃO (Aceita prop 'position')
  const CompareInfoOverlay = ({ item, position }) => (
    <View style={[styles.compareOverlay, position === 'top' ? styles.compareOverlayTop : styles.compareOverlayBottom]}>
      <Text style={styles.compDate}>{formatDate(item.date)}</Text>
      <Text style={styles.compWeight}>{item.weight} kg</Text>
      {item.measurements && (
        <View style={styles.compMeasures}>
          <View style={styles.compRow}><Text style={styles.compTxt}>Cint: {item.measurements.waist || '-'}</Text><Text style={styles.compTxt}>Peit: {item.measurements.chest || '-'}</Text></View>
          <View style={styles.compRow}><Text style={styles.compTxt}>Braç: {item.measurements.arm || '-'}</Text><Text style={styles.compTxt}>Quad: {item.measurements.hips || '-'}</Text></View>
        </View>
      )}
    </View>
  );

  const bodyDates = Object.keys(gallery).sort().reverse();
  const mealDates = Object.keys(mealHistory).filter(date => {
    const day = mealHistory[date];
    return day.meals && day.meals.some(m => m.image);
  }).sort().reverse();

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('body')} style={[styles.tabBtn, activeTab === 'body' && styles.tabBtnActive]}><Text style={[styles.tabText, activeTab === 'body' && styles.tabTextActive]}>Meu Corpo</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('meals')} style={[styles.tabBtn, activeTab === 'meals' && styles.tabBtnActive]}><Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>Refeições</Text></TouchableOpacity>
      </View>

      {activeTab === 'body' && (
        <>
          <TouchableOpacity style={styles.btnAdd} onPress={handleAddBodyPhoto}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}><Feather name="camera" size={24} color="#fff" /><Text style={styles.btnText}>Registrar Evolução</Text></LinearGradient>
          </TouchableOpacity>

          <FlatList
            data={bodyDates}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<View style={styles.emptyState}><Feather name="user" size={50} color="#ddd" /><Text style={styles.emptyText}>Sem fotos de evolução.</Text></View>}
            renderItem={({ item: date }) => (
              <View style={styles.dateSection}>
                <View style={styles.dateHeader}><Feather name="calendar" size={16} color="#7c3aed" /><Text style={styles.dateText}>{formatDate(date)}</Text></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  {gallery[date].map((item, index) => (
                    <TouchableOpacity key={index} onPress={() => setSelectedImage({ ...item, date, type: 'body' })} style={styles.cardWrapper}>
                      <Image source={{ uri: item.uri }} style={styles.thumbnailBody} />
                      {item.weight && <View style={styles.weightBadge}><Text style={styles.weightText}>{item.weight}kg</Text></View>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          />
        </>
      )}

      {activeTab === 'meals' && (
        <FlatList
          data={mealDates}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<View style={styles.emptyState}><Feather name="coffee" size={50} color="#ddd" /><Text style={styles.emptyText}>Sem fotos de refeições.</Text></View>}
          renderItem={({ item: date }) => (
            <View style={styles.dateSection}>
              <View style={styles.dateHeader}><Feather name="calendar" size={16} color="#16a34a" /><Text style={styles.dateText}>{formatDate(date)}</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {mealHistory[date].meals.filter(m => m.image).map((meal, index) => (
                  <TouchableOpacity key={index} onPress={() => setSelectedImage({ uri: meal.image, id: meal.id, date, type: 'meal', data: meal })} style={styles.mealCard}>
                    <Image source={{ uri: meal.image }} style={styles.thumbnailMeal} />
                    <View style={styles.mealInfo}><Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text><Text style={styles.mealCal}>{meal.calories} kcal</Text></View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Medidas</Text>
            <ScrollView style={{maxHeight: 400, width: '100%'}} showsVerticalScrollIndicator={false}>
              {tempPhotoUri && <Image source={{ uri: tempPhotoUri }} style={styles.modalPreview} />}
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput style={styles.input} placeholder="Ex: 75" keyboardType="numeric" value={weightInput} onChangeText={setWeightInput} />
              <Text style={styles.inputLabel}>Medidas (cm - Opcional)</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Cintura" keyboardType="numeric" value={waistInput} onChangeText={setWaistInput} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Quadril" keyboardType="numeric" value={hipInput} onChangeText={setHipInput} />
              </View>
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Peito" keyboardType="numeric" value={chestInput} onChangeText={setChestInput} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Braço" keyboardType="numeric" value={armInput} onChangeText={setArmInput} />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveFinalBodyPhoto} style={styles.btnSave}><Text style={styles.btnSaveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isPickingCompare} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Escolha para comparar</Text>
            <FlatList 
              data={getAllBodyPhotos()}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => { setCompareImage(item); setIsPickingCompare(false); }}>
                   <Image source={{uri: item.uri}} style={styles.pickerThumb} />
                   <Text style={styles.pickerDate}>{formatDate(item.date)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.btnCancelPicker} onPress={() => setIsPickingCompare(false)}><Text style={styles.btnCancelText}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ZOOM / COMPARAÇÃO */}
      <Modal visible={selectedImage !== null} transparent={true} animationType="fade">
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleCloseZoom}><Feather name="x" size={28} color="#fff" /></TouchableOpacity>
          {!compareImage && <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteCurrent}><Feather name="trash-2" size={28} color="#ef4444" /></TouchableOpacity>}

          {compareImage ? (
            // --- MUDANÇA AQUI: FLEX COLUMN PARA VERTICAL ---
            <View style={[styles.compareContainer, { flexDirection: 'column' }]}>
              
              {/* PARTE DE CIMA (Mais antiga) */}
              <View style={styles.compareHalf}>
                <Image source={{ uri: compareImage.uri }} style={styles.compareImage} resizeMode={resizeMode} />
                {/* Info no TOPO */}
                <CompareInfoOverlay item={compareImage} position="top" />
              </View>
              
              {/* DIVISOR HORIZONTAL */}
              <View style={styles.compareDividerHorizontal} />
              
              {/* PARTE DE BAIXO (Mais nova) */}
              <View style={styles.compareHalf}>
                <Image source={{ uri: selectedImage.uri }} style={styles.compareImage} resizeMode={resizeMode} />
                {/* Info no RODAPÉ */}
                <CompareInfoOverlay item={selectedImage} position="bottom" />
              </View>
              
              <TouchableOpacity style={styles.resizeBtn} onPress={toggleResizeMode}><Feather name={resizeMode === 'contain' ? 'maximize' : 'minimize'} size={20} color="#fff" /><Text style={{color:'#fff', marginLeft:5, fontWeight:'bold'}}>{resizeMode === 'contain' ? 'Preencher' : 'Ajustar'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.stopCompareBtn} onPress={() => setCompareImage(null)}><Text style={{color:'#fff', fontWeight:'bold'}}>Fechar Comparação</Text></TouchableOpacity>
            </View>
          ) : (
            selectedImage && (
              <>
                <Image source={{ uri: selectedImage.uri }} style={styles.fullImage} resizeMode="contain" />
                {selectedImage.type === 'body' && (
                  <>
                    <TouchableOpacity style={styles.compareBtn} onPress={() => setIsPickingCompare(true)}>
                      <Feather name="columns" size={20} color="#fff" style={{transform: [{rotate: '90deg'}]}} /> 
                      <Text style={styles.compareBtnText}>Comparar</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.measurePanel}>
                       <View style={styles.measureRow}><Text style={styles.measureTitle}>Peso: <Text style={styles.measureVal}>{selectedImage.weight}kg</Text></Text></View>
                       {selectedImage.measurements && (
                         <View style={styles.measureGrid}>
                           <View style={styles.measureItem}><Text style={styles.measureLbl}>Cintura</Text><Text style={styles.measureValSmall}>{selectedImage.measurements.waist || '--'}</Text></View>
                           <View style={styles.measureItem}><Text style={styles.measureLbl}>Peito</Text><Text style={styles.measureValSmall}>{selectedImage.measurements.chest || '--'}</Text></View>
                           <View style={styles.measureItem}><Text style={styles.measureLbl}>Braço</Text><Text style={styles.measureValSmall}>{selectedImage.measurements.arm || '--'}</Text></View>
                           <View style={styles.measureItem}><Text style={styles.measureLbl}>Quadril</Text><Text style={styles.measureValSmall}>{selectedImage.measurements.hips || '--'}</Text></View>
                         </View>
                       )}
                    </View>
                  </>
                )}

                {selectedImage.type === 'meal' && selectedImage.data && (
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoTitle}>{selectedImage.data.name}</Text>
                    {selectedImage.data.description && <Text style={styles.infoDesc}>{selectedImage.data.description}</Text>}
                    <Text style={styles.infoWeight}>{selectedImage.data.weight}</Text>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}><Text style={styles.infoLabel}>Kcal</Text><Text style={styles.infoValue}>{selectedImage.data.calories}</Text></View>
                      <View style={styles.infoDivider} /><View style={styles.infoItem}><Text style={styles.infoLabel}>Carb</Text><Text style={styles.infoValue}>{selectedImage.data.carbs || 0}g</Text></View>
                      <View style={styles.infoItem}><Text style={styles.infoLabel}>Prot</Text><Text style={styles.infoValue}>{selectedImage.data.protein || 0}g</Text></View>
                      <View style={styles.infoItem}><Text style={styles.infoLabel}>Gord</Text><Text style={styles.infoValue}>{selectedImage.data.fat || 0}g</Text></View>
                      <View style={styles.infoItem}><Text style={styles.infoLabel}>Aç</Text><Text style={[styles.infoValue, {color: '#fca5a5'}]}>{selectedImage.data.sugar || 0}g</Text></View>
                    </View>
                  </View>
                )}
              </>
            )
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#7c3aed', fontWeight: 'bold' },
  btnAdd: { marginBottom: 15 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 10 },
  dateSection: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 2 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 5 },
  dateText: { fontWeight: 'bold', color: '#555', marginLeft: 8 },
  cardWrapper: { marginRight: 15, width: 110, position: 'relative' },
  thumbnailBody: { width: 110, height: 140, borderRadius: 10, backgroundColor: '#eee' },
  weightBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  weightText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  mealCard: { marginRight: 15, width: 120 },
  thumbnailMeal: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#eee', marginBottom: 5 },
  mealInfo: { alignItems: 'center' },
  mealName: { fontWeight: 'bold', color: '#333', fontSize: 12, textAlign: 'center' },
  mealCal: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalPreview: { width: 100, height: 100, borderRadius: 10, marginBottom: 15, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, width: '100%', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  inputLabel: { fontWeight: 'bold', color: '#666', marginBottom: 5, marginTop: 5, alignSelf: 'flex-start' },
  row: { flexDirection: 'row' },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, backgroundColor: '#8b5cf6', borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  deleteBtn: { position: 'absolute', top: 50, left: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  fullImage: { width: '100%', height: '60%' },
  infoPanel: { position: 'absolute', bottom: 40, width: '90%', backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 20, alignItems: 'center' },
  infoTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  infoDesc: { color: '#bbb', fontSize: 13, fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  infoWeight: { color: '#16a34a', fontSize: 14, marginBottom: 15, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#aaa', fontSize: 10, textTransform: 'uppercase' },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoDivider: { width: 1, height: 30, backgroundColor: '#444' },
  measurePanel: { position: 'absolute', bottom: 40, width: '90%', backgroundColor: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 20 },
  measureRow: { alignItems: 'center', marginBottom: 15 },
  measureTitle: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  measureVal: { fontSize: 24, fontWeight: 'bold', color: '#7c3aed' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  measureItem: { width: '22%', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 8, borderRadius: 10 },
  measureLbl: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  measureValSmall: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  
  compareBtn: { position: 'absolute', bottom: 200, backgroundColor: '#7c3aed', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  compareBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  
  pickerContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, height: '60%' },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerItem: { flex: 1, margin: 5, alignItems: 'center' },
  pickerThumb: { width: width/3 - 30, height: 100, borderRadius: 10, backgroundColor: '#eee' },
  pickerDate: { fontSize: 10, color: '#666', marginTop: 5 },
  btnCancelPicker: { padding: 15, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center', marginTop: 10 },
  
  // --- ESTILOS DE COMPARAÇÃO VERTICAL ---
  compareContainer: { width: '100%', height: '70%', alignItems: 'center', backgroundColor: '#000' }, // Altura maior
  compareHalf: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  compareImage: { width: '100%', height: '100%' },
  compareDividerHorizontal: { width: '100%', height: 2, backgroundColor: '#fff' },
  
  // Overlay que se adapta ao topo ou base
  compareOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8, alignItems: 'center', width: '90%' },
  compareOverlayTop: { top: 10 },
  compareOverlayBottom: { bottom: 10 },
  
  compDate: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  compWeight: { color: '#d8b4fe', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  compMeasures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  compRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  compTxt: { color: '#ccc', fontSize: 8 },
  stopCompareBtn: { position: 'absolute', bottom: -60, alignSelf: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  resizeBtn: { position: 'absolute', top: -50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
});