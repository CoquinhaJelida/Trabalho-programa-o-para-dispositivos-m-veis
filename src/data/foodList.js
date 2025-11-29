export const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'Salgada', name: 'Salgados' },
  { id: 'Proteina', name: 'Proteínas' },
  { id: 'Carboidratos', name: 'Carboidratos' },
  { id: 'Massa', name: 'Massas' },
  { id: 'Verdura', name: 'Verduras' },
  { id: 'Fruta', name: 'Frutas' },
  { id: 'Doce', name: 'Doces' },
  { id: 'Bebida', name: 'Bebidas' },
  { id: 'Suplemento', name: 'Suplementos' },
];

// calories: kcal em 100g
// sugar: gramas de açúcar em 100g
export const initialFoods = [
  // --- BÁSICO ---
  { id: '1', name: 'Arroz Branco', calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0, category: 'Carboidratos', unit_weight: 100 },
  { id: '2', name: 'Feijão Carioca', calories: 76, carbs: 14, protein: 4.8, fat: 0.5, sugar: 0, category: 'Salgada', unit_weight: 100 },
  { id: '3', name: 'Ovo Cozido', calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 0, category: 'Proteina', unit_weight: 50 },
  { id: '4', name: 'Peito de Frango', calories: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, category: 'Proteina', unit_weight: 100 },
  { id: '5', name: 'Pão Francês', calories: 300, carbs: 58, protein: 8, fat: 3, sugar: 2, category: 'Massa', unit_weight: 50 },
  
  // --- FRUTAS (Açúcar natural) ---
  { id: '6', name: 'Banana Prata', calories: 98, carbs: 26, protein: 1.3, fat: 0.1, sugar: 15, category: 'Fruta', unit_weight: 80 },
  { id: '7', name: 'Maçã', calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sugar: 10, category: 'Fruta', unit_weight: 130 },
  { id: '8', name: 'Uva', calories: 67, carbs: 17, protein: 0.6, fat: 0.4, sugar: 16, category: 'Fruta', unit_weight: 5 }, // 1 uva
  { id: '9', name: 'Melancia', calories: 30, carbs: 8, protein: 0.6, fat: 0.2, sugar: 6, category: 'Fruta', unit_weight: 200 }, // 1 fatia

  // --- DOCES E BEBIDAS (Açúcar adicionado) ---
  { id: '12', name: 'Chocolate ao Leite', calories: 535, carbs: 59, protein: 7, fat: 30, sugar: 50, category: 'Doce', unit_weight: 25 },
  { id: '13', name: 'Refrigerante Cola', calories: 42, carbs: 10.6, protein: 0, fat: 0, sugar: 10.6, category: 'Bebida', unit_weight: 350 },
  { id: '14', name: 'Suco de Laranja', calories: 45, carbs: 10, protein: 0.7, fat: 0.2, sugar: 8.4, category: 'Bebida', unit_weight: 200 },
  { id: '15', name: 'Brigadeiro', calories: 380, carbs: 50, protein: 6, fat: 18, sugar: 45, category: 'Doce', unit_weight: 20 },
  { id: '16', name: 'Sorvete de Creme', calories: 207, carbs: 24, protein: 3.5, fat: 11, sugar: 21, category: 'Doce', unit_weight: 60 }, // 1 bola

  // --- OUTROS ---
  { id: '10', name: 'Batata Doce', calories: 86, carbs: 20, protein: 1.6, fat: 0.1, sugar: 4, category: 'Carboidratos', unit_weight: 100 },
  { id: '11', name: 'Whey Protein', calories: 400, carbs: 10, protein: 80, fat: 5, sugar: 2, category: 'Suplemento', unit_weight: 30 },
];