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
  
  // NOVO: Controle de redimensionamento (contain = ver inteira / cover = preencher)
  const [resizeMode, setResizeMode] = useState('contain'); 

  const [modalVisible, setModalVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    getGallery(setGallery);
    getHistory(setMealHistory);
  };

  const prepareWeightInput = () => {
    getProfile((data) => {
      if (data && data.weight) setWeightInput(data.weight);
      else setWeightInput('');
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
    const options = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [4, 5] };
    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Erro", "Sem permissão.");
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled) {
      setTempPhotoUri(result.assets[0].uri);
      prepareWeightInput();
      setModalVisible(true);
    }
  };

  const saveFinalBodyPhoto = async () => {
    if (tempPhotoUri) {
      const today = getTodayKey();
      await savePhotoLog(today, tempPhotoUri, weightInput);
      setModalVisible(false);
      setTempPhotoUri(null);
      loadData();
    }
  };

  const handleDeleteCurrent = () => {
    if (!selectedImage) return;
    Alert.alert(
      "Excluir", 
      selectedImage.type === 'meal' ? "Apagar refeição?" : "Apagar foto?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          onPress: async () => {
            if (selectedImage.type === 'body') await deletePhoto(selectedImage.date, selectedImage.id, setGallery);
            else await deleteMealFromHistory(selectedImage.date, selectedImage.id, () => getHistory(setMealHistory));
            handleCloseZoom();
          } 
        }
      ]
    );
  };

  const handleCloseZoom = () => {
    setSelectedImage(null);
    setCompareImage(null);
    setIsPickingCompare(false);
    setResizeMode('contain'); // Reseta para o modo padrão
  };

  // Toggle entre Ajustar (ver tudo) e Preencher (zoom)
  const toggleResizeMode = () => {
    setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain');
  };

  const formatDate = (dateStr) => dateStr.split('-').reverse().join('/');

  const getAllBodyPhotos = () => {
    const allPhotos = [];
    Object.keys(gallery).sort().reverse().forEach(date => {
      gallery[date].forEach(photo => {
        allPhotos.push({ ...photo, date });
      });
    });
    return allPhotos;
  };

  const bodyDates = Object.keys(gallery).sort().reverse();
  const mealDates = Object.keys(mealHistory).filter(date => {
    const day = mealHistory[date];
    return day.meals && day.meals.some(m => m.image);
  }).sort().reverse();

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('body')} style={[styles.tabBtn, activeTab === 'body' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, activeTab === 'body' && styles.tabTextActive]}>Meu Corpo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('meals')} style={[styles.tabBtn, activeTab === 'meals' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>Refeições</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'body' && (
        <>
          <TouchableOpacity style={styles.btnAdd} onPress={handleAddBodyPhoto}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
              <Feather name="camera" size={24} color="#fff" />
              <Text style={styles.btnText}>Registrar Evolução</Text>
            </LinearGradient>
          </TouchableOpacity>

          <FlatList
            data={bodyDates}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<View style={styles.emptyState}><Feather name="user" size={50} color="#ddd" /><Text style={styles.emptyText}>Sem fotos de evolução.</Text></View>}
            renderItem={({ item: date }) => (
              <View style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Feather name="calendar" size={16} color="#7c3aed" />
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  {gallery[date].map((item, index) => (
                    <TouchableOpacity key={index} onPress={() => setSelectedImage({ uri: item.uri || item, id: item.id||item, date, weight: item.weight, type: 'body' })} style={styles.cardWrapper}>
                      <Image source={{ uri: item.uri || item }} style={styles.thumbnailBody} />
                      {(item.weight) && <View style={styles.weightBadge}><Text style={styles.weightText}>{item.weight}kg</Text></View>}
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
              <View style={styles.dateHeader}>
                <Feather name="calendar" size={16} color="#16a34a" />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </View>
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

      {/* MODAL PESO */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Peso Atual</Text>
            {tempPhotoUri && <Image source={{ uri: tempPhotoUri }} style={styles.modalPreview} />}
            <TextInput style={styles.input} placeholder="Kg" keyboardType="numeric" value={weightInput} onChangeText={setWeightInput} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveFinalBodyPhoto} style={styles.btnSave}><Text style={styles.btnSaveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ESCOLHA (COMPARAR) */}
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
                   <Image source={{uri: item.uri || item}} style={styles.pickerThumb} />
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
          
          {!compareImage && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteCurrent}><Feather name="trash-2" size={28} color="#ef4444" /></TouchableOpacity>
          )}

          {compareImage ? (
            <View style={styles.compareContainer}>
              {/* FOTO 1 */}
              <View style={styles.compareHalf}>
                <Image source={{ uri: selectedImage.uri }} style={styles.compareImage} resizeMode={resizeMode} />
                <View style={styles.compareLabel}><Text style={styles.compareText}>{formatDate(selectedImage.date)}</Text><Text style={styles.compareSub}>{selectedImage.weight} kg</Text></View>
              </View>
              <View style={styles.compareDivider} />
              {/* FOTO 2 */}
              <View style={styles.compareHalf}>
                <Image source={{ uri: compareImage.uri || compareImage }} style={styles.compareImage} resizeMode={resizeMode} />
                <View style={styles.compareLabel}><Text style={styles.compareText}>{formatDate(compareImage.date)}</Text><Text style={styles.compareSub}>{compareImage.weight} kg</Text></View>
              </View>
              
              {/* BOTÃO DE AJUSTE DE IMAGEM */}
              <TouchableOpacity style={styles.resizeBtn} onPress={toggleResizeMode}>
                <Feather name={resizeMode === 'contain' ? 'maximize' : 'minimize'} size={20} color="#fff" />
                <Text style={{color:'#fff', marginLeft:5, fontWeight:'bold'}}>
                  {resizeMode === 'contain' ? 'Preencher' : 'Ajustar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.stopCompareBtn} onPress={() => setCompareImage(null)}><Text style={{color:'#fff', fontWeight:'bold'}}>Fechar Comparação</Text></TouchableOpacity>
            </View>
          ) : (
            selectedImage && (
              <>
                <Image source={{ uri: selectedImage.uri }} style={styles.fullImage} resizeMode="contain" />
                {selectedImage.type === 'body' && (
                  <TouchableOpacity style={styles.compareBtn} onPress={() => setIsPickingCompare(true)}>
                    <Feather name="columns" size={20} color="#fff" />
                    <Text style={styles.compareBtnText}>Comparar</Text>
                  </TouchableOpacity>
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
                {selectedImage.type === 'body' && selectedImage.weight && (<View style={styles.infoPanelBody}><Text style={styles.infoLabel}>Peso</Text><Text style={styles.infoValueBody}>{selectedImage.weight} kg</Text></View>)}
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
  modalButtons: { flexDirection: 'row', width: '100%', gap: 10 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: 'bold' },
  btnSave: { flex: 1, padding: 12, backgroundColor: '#8b5cf6', borderRadius: 10, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  zoomContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  deleteBtn: { position: 'absolute', top: 50, left: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  fullImage: { width: '100%', height: '70%' },
  infoPanel: { position: 'absolute', bottom: 40, width: '90%', backgroundColor: 'rgba(20,20,20,0.95)', padding: 20, borderRadius: 20, alignItems: 'center' },
  infoTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  infoDesc: { color: '#bbb', fontSize: 13, fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  infoWeight: { color: '#16a34a', fontSize: 14, marginBottom: 15, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#aaa', fontSize: 10, textTransform: 'uppercase' },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoDivider: { width: 1, height: 30, backgroundColor: '#444' },
  infoPanelBody: { position: 'absolute', bottom: 60, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  infoValueBody: { fontSize: 24, fontWeight: 'bold', color: '#7c3aed' },
  
  // --- NOVOS ESTILOS DE COMPARAÇÃO ---
  compareBtn: { position: 'absolute', bottom: 140, backgroundColor: '#7c3aed', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  compareBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  
  pickerContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, height: '60%' },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerItem: { flex: 1, margin: 5, alignItems: 'center' },
  pickerThumb: { width: width/3 - 30, height: 100, borderRadius: 10, backgroundColor: '#eee' },
  pickerDate: { fontSize: 10, color: '#666', marginTop: 5 },
  btnCancelPicker: { padding: 15, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center', marginTop: 10 },

  compareContainer: { flexDirection: 'row', width: '100%', height: '60%', alignItems: 'center', backgroundColor: '#000' },
  compareHalf: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  compareImage: { width: '100%', height: '100%', borderRadius: 0 }, // Borda 0 para juntar bem
  compareDivider: { width: 2, height: '100%', backgroundColor: '#fff' },
  compareLabel: { position: 'absolute', bottom: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  compareText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  compareSub: { color: '#d8b4fe', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  stopCompareBtn: { position: 'absolute', bottom: -60, alignSelf: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  
  resizeBtn: { position: 'absolute', top: -50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
});