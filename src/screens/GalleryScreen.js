import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Modal, TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// Importamos getHistory para ler as fotos das refeições
import { savePhotoLog, getGallery, deletePhoto, getTodayKey, getProfile, getHistory } from '../services/db';

export default function GalleryScreen() {
  const [activeTab, setActiveTab] = useState('body'); // 'body' ou 'meals'
  
  // Dados
  const [bodyGallery, setBodyGallery] = useState({});
  const [mealHistory, setMealHistory] = useState({});
  
  // Visualização (Zoom)
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Modal de Peso (Apenas para Corpo)
  const [modalVisible, setModalVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  // Recarrega os dados sempre que entrar na tela ou mudar de aba
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = () => {
    // 1. Carrega fotos do corpo
    getGallery(setBodyGallery);
    // 2. Carrega histórico de refeições (para filtrar as que têm foto)
    getHistory(setMealHistory);
  };

  const prepareWeightInput = () => {
    getProfile((data) => {
      if (data && data.weight) setWeightInput(data.weight);
      else setWeightInput('');
    });
  };

  // --- FUNÇÕES DA GALERIA DE CORPO ---

  const handleAddBodyPhoto = async () => {
    Alert.alert("Nova Foto", "Escolha a origem:", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => pickImage('gallery') },
      { text: "Câmera", onPress: () => pickImage('camera') },
    ]);
  };

  const pickImage = async (type) => {
    let result;
    const options = { 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.7, 
      allowsEditing: true, 
      aspect: [4, 5] 
    };

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

  const handleDeleteBody = (date, id) => {
    Alert.alert("Excluir", "Apagar este registro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim", onPress: () => deletePhoto(date, id, setBodyGallery) }
    ]);
  };

  // --- PREPARAÇÃO DAS LISTAS ---

  // Datas com fotos de corpo
  const bodyDates = Object.keys(bodyGallery).sort().reverse();

  // Datas com fotos de comida (Filtra o histórico para achar refeições com 'image')
  const mealDates = Object.keys(mealHistory).filter(date => {
    const day = mealHistory[date];
    return day.meals && day.meals.some(m => m.image);
  }).sort().reverse();

  return (
    <View style={styles.container}>
      
      {/* SELETOR DE ABAS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('body')} 
          style={[styles.tabBtn, activeTab === 'body' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'body' && styles.tabTextActive]}>Meu Corpo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('meals')} 
          style={[styles.tabBtn, activeTab === 'meals' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>Refeições</Text>
        </TouchableOpacity>
      </View>

      {/* --- CONTEÚDO: CORPO --- */}
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
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="user" size={50} color="#ddd" />
                <Text style={styles.emptyText}>Sem fotos de evolução.</Text>
              </View>
            }
            renderItem={({ item: date }) => (
              <View style={styles.dateSection}>
                <View style={styles.dateHeader}>
                  <Feather name="calendar" size={16} color="#7c3aed" />
                  <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  {bodyGallery[date].map((item, index) => {
                    const uri = item.uri || item; 
                    const weight = item.weight || null; 
                    const id = item.id || item;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        onPress={() => setSelectedImage({ uri })} 
                        onLongPress={() => handleDeleteBody(date, id)} 
                        style={styles.cardWrapper}
                      >
                        <Image source={{ uri }} style={styles.thumbnailBody} />
                        {weight && (
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightText}>{weight}kg</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          />
        </>
      )}

      {/* --- CONTEÚDO: REFEIÇÕES --- */}
      {activeTab === 'meals' && (
        <FlatList
          data={mealDates}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="coffee" size={50} color="#ddd" />
              <Text style={styles.emptyText}>Nenhuma refeição fotografada.</Text>
              <Text style={{color:'#aaa', fontSize: 12}}>Adicione fotos na aba Refeições.</Text>
            </View>
          }
          renderItem={({ item: date }) => (
            <View style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Feather name="calendar" size={16} color="#16a34a" />
                <Text style={styles.dateText}>{date.split('-').reverse().join('/')}</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {mealHistory[date].meals
                  .filter(m => m.image) // Só mostra as que tem foto
                  .map((meal, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => setSelectedImage({ uri: meal.image })} 
                      style={styles.mealCard}
                    >
                      <Image source={{ uri: meal.image }} style={styles.thumbnailMeal} />
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                        <Text style={styles.mealCal}>{meal.calories} kcal</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            </View>
          )}
        />
      )}

      {/* --- MODAL DE PESO (CORPO) --- */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Peso Atual</Text>
            {tempPhotoUri && <Image source={{ uri: tempPhotoUri }} style={styles.modalPreview} />}
            <TextInput 
              style={styles.input} 
              placeholder="Kg" 
              keyboardType="numeric" 
              value={weightInput} 
              onChangeText={setWeightInput} 
              autoFocus 
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveFinalBodyPhoto} style={styles.btnSave}>
                <Text style={styles.btnSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DE ZOOM (COMUM) --- */}
      <Modal visible={selectedImage !== null} transparent={true} animationType="fade">
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Feather name="x" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  
  // Abas
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
  
  // Estilo CORPO
  cardWrapper: { marginRight: 15, width: 110, position: 'relative' },
  thumbnailBody: { width: 110, height: 140, borderRadius: 10, backgroundColor: '#eee' },
  weightBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  weightText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Estilo REFEIÇÕES
  mealCard: { marginRight: 15, width: 120 },
  thumbnailMeal: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#eee', marginBottom: 5 },
  mealInfo: { alignItems: 'center' },
  mealName: { fontWeight: 'bold', color: '#333', fontSize: 12, textAlign: 'center' },
  mealCal: { color: '#16a34a', fontSize: 12, fontWeight: '600' },

  // Modais
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
  zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  fullImage: { width: '100%', height: '80%' },
});