import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { saveProfile } from '../services/db';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dados de Acesso
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dados de Perfil
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  
  // NOVO: Objetivo no Cadastro
  const [objective, setObjective] = useState('lose'); // 'lose', 'maintain', 'gain'

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Erro", "Preencha email e senha.");
    
    if (!isLogin) {
      if (!name || !age || !weight || !height) {
        return Alert.alert("Erro", "Preencha todos os dados do perfil.");
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Define calorias iniciais baseado no objetivo escolhido
        let baseCals = gender === 'male' ? 2500 : 2000;
        if (objective === 'lose') baseCals -= 300;
        if (objective === 'gain') baseCals += 300;

        const profileData = {
          name, age, weight, height, gender,
          activityLevel: 1.2,
          objective: objective, // Salva a escolha
          calorieGoal: String(baseCals),
          targetWeight: weight, // Começa igual
          isStrict: false
        };

        await saveProfile(profileData);
      }
    } catch (error) {
      let msg = error.message;
      if (msg.includes('invalid-email')) msg = "Email inválido.";
      if (msg.includes('weak-password')) msg = "Senha fraca.";
      if (msg.includes('email-already-in-use')) msg = "Email já cadastrado.";
      if (msg.includes('user-not-found') || msg.includes('wrong-password')) msg = "Dados incorretos.";
      Alert.alert("Atenção", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#16a34a', '#14532d']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoArea}>
            <View style={styles.iconCircle}><Feather name="activity" size={40} color="#16a34a" /></View>
            <Text style={styles.title}>NutriLife</Text>
            <Text style={styles.subtitle}>{isLogin ? "Bem-vindo de volta!" : "Configure seu perfil"}</Text>
          </View>

          <View style={styles.card}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} placeholder="Seu Nick" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
                
                <View style={styles.row}>
                  <View style={{flex:1, marginRight: 10}}><Text style={styles.label}>Idade</Text><TextInput style={styles.input} placeholder="Anos" placeholderTextColor="#9ca3af" keyboardType="numeric" value={age} onChangeText={setAge} /></View>
                  <View style={{flex:1}}>
                     <Text style={styles.label}>Sexo</Text>
                     <View style={styles.genderRow}>
                        <TouchableOpacity onPress={()=>setGender('male')} style={[styles.genderBtn, gender==='male' && styles.genderBtnActive]}><Feather name="user" size={16} color={gender==='male'?'#fff':'#666'} /></TouchableOpacity>
                        <TouchableOpacity onPress={()=>setGender('female')} style={[styles.genderBtn, gender==='female' && styles.genderBtnActive]}><Feather name="user" size={16} color={gender==='female'?'#fff':'#666'} /></TouchableOpacity>
                     </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{flex:1, marginRight: 10}}><Text style={styles.label}>Peso (kg)</Text><TextInput style={styles.input} placeholder="Kg" placeholderTextColor="#9ca3af" keyboardType="numeric" value={weight} onChangeText={setWeight} /></View>
                  <View style={{flex:1}}><Text style={styles.label}>Altura (cm)</Text><TextInput style={styles.input} placeholder="Cm" placeholderTextColor="#9ca3af" keyboardType="numeric" value={height} onChangeText={setHeight} /></View>
                </View>

                {/* --- SELETOR DE OBJETIVO NO CADASTRO --- */}
                <Text style={styles.label}>Qual seu objetivo principal?</Text>
                <View style={styles.objRow}>
                  <TouchableOpacity onPress={()=>setObjective('lose')} style={[styles.objBtn, objective==='lose' && styles.objBtnActive]}>
                    <Text style={[styles.objText, objective==='lose' && styles.objTextActive]}>Secar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setObjective('maintain')} style={[styles.objBtn, objective==='maintain' && styles.objBtnActive]}>
                    <Text style={[styles.objText, objective==='maintain' && styles.objTextActive]}>Manter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setObjective('gain')} style={[styles.objBtn, objective==='gain' && styles.objBtnActive]}>
                    <Text style={[styles.objText, objective==='gain' && styles.objTextActive]}>Crescer</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="email@exemplo.com" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            
            <Text style={styles.label}>Senha</Text>
            <TextInput style={styles.input} placeholder="******" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={styles.btnMain} onPress={handleAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLogin ? "ENTRAR" : "FINALIZAR CADASTRO"}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.btnLink}>
              <Text style={styles.linkText}>{isLogin ? "Novo aqui? Crie sua conta" : "Já tenho conta. Fazer login"}</Text>
            </TouchableOpacity>
          </View>
          <View style={{height: 50}} /> 
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  logoArea: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#dcfce7' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  genderRow: { flexDirection: 'row', height: 50, backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 4 },
  genderBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  genderBtnActive: { backgroundColor: '#16a34a' },
  
  // Estilos do Objetivo
  objRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  objBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  objBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  objText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  objTextActive: { color: '#fff' },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 },
  btnMain: { backgroundColor: '#16a34a', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnLink: { marginTop: 20, alignItems: 'center', padding: 10 },
  linkText: { color: '#16a34a', fontWeight: '600' }
});