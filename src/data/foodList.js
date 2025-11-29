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
// unit_weight: peso médio de 1 unidade ou 1 porção comum
export const initialFoods = [
  // --- BÁSICO ---
  { id: '1', name: 'Arroz Branco', calories: 130, category: 'Carboidratos', unit_weight: 100 }, // 1 colher servir
  { id: '2', name: 'Feijão Carioca', calories: 76, category: 'Salgada', unit_weight: 100 }, // 1 concha
  { id: '3', name: 'Ovo Cozido', calories: 155, category: 'Proteina', unit_weight: 50 }, // 1 unidade
  { id: '4', name: 'Ovo Frito', calories: 240, category: 'Proteina', unit_weight: 50 },
  { id: '5', name: 'Pão Francês', calories: 300, category: 'Massa', unit_weight: 50 },
  { id: '6', name: 'Pão de Forma', calories: 250, category: 'Massa', unit_weight: 25 }, // 1 fatia
  { id: '7', name: 'Banana Prata', calories: 98, category: 'Fruta', unit_weight: 80 },
  { id: '8', name: 'Maçã', calories: 52, category: 'Fruta', unit_weight: 130 },
  { id: '9', name: 'Peito de Frango', calories: 165, category: 'Proteina', unit_weight: 100 }, // 1 filé médio
  { id: '10', name: 'Batata Doce', calories: 86, category: 'Carboidratos', unit_weight: 100 },
  { id: '11', name: 'Macarrão Cozido', calories: 157, category: 'Massa', unit_weight: 140 }, // 1 prato raso
  { id: '12', name: 'Chocolate', calories: 535, category: 'Doce', unit_weight: 25 }, // 1 bombom/barra peq
  { id: '13', name: 'Refrigerante', calories: 42, category: 'Bebida', unit_weight: 350 }, // 1 lata
  { id: '14', name: 'Cerveja', calories: 43, category: 'Bebida', unit_weight: 350 }, // 1 lata
  { id: '15', name: 'Tapioca', calories: 235, category: 'Carboidratos', unit_weight: 100 },
  { id: '16', name: 'Queijo Mussarela', calories: 280, category: 'Proteina', unit_weight: 20 }, // 1 fatia
  { id: '17', name: 'Presunto', calories: 120, category: 'Salgada', unit_weight: 20 }, // 1 fatia
  { id: '18', name: 'Aveia', calories: 389, category: 'Carboidratos', unit_weight: 30 }, // 1 colher sopa cheia
  { id: '19', name: 'Whey Protein', calories: 120, category: 'Suplemento', unit_weight: 30 }, // 1 scoop
  { id: '20', name: 'Coxinha', calories: 300, category: 'Salgada', unit_weight: 100 },
];