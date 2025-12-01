export const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'Salgada', name: 'Salgados' },
  { id: 'Proteina', name: 'Proteínas' },
  { id: 'Carboidratos', name: 'Carboidratos' },
  { id: 'Massa', name: 'Massas' },
  { id: 'Verdura', name: 'Verduras/Legumes' },
  { id: 'Fruta', name: 'Frutas' },
  { id: 'Doce', name: 'Doces' },
  { id: 'Bebida', name: 'Bebidas' },
  { id: 'Suplemento', name: 'Suplementos' },
];

// calories: kcal em 100g (ou 100ml)
// unit_weight: peso médio de 1 unidade ou porção comum em gramas (ou ml)
export const initialFoods = [
  
  { id: '1', name: 'Arroz Branco Cozido', calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sugar: 0, category: 'Carboidratos', unit_weight: 150 }, // 1 escumadeira
  { id: '2', name: 'Arroz Integral Cozido', calories: 110, carbs: 23, protein: 2.6, fat: 0.9, sugar: 0, category: 'Carboidratos', unit_weight: 150 },
  { id: '3', name: 'Feijão Carioca', calories: 76, carbs: 14, protein: 4.8, fat: 0.5, sugar: 0, category: 'Salgada', unit_weight: 130 }, // 1 concha média
  { id: '4', name: 'Feijão Preto', calories: 77, carbs: 14, protein: 4.5, fat: 0.5, sugar: 0, category: 'Salgada', unit_weight: 130 },
  { id: '5', name: 'Ovo Cozido', calories: 155, carbs: 1.1, protein: 13, fat: 11, sugar: 0, category: 'Proteina', unit_weight: 50 }, // 1 unidade
  { id: '6', name: 'Ovo Frito', calories: 240, carbs: 0.6, protein: 14, fat: 19, sugar: 0, category: 'Proteina', unit_weight: 50 }, 
  { id: '7', name: 'Peito de Frango Grelhado', calories: 165, carbs: 0, protein: 31, fat: 3.6, sugar: 0, category: 'Proteina', unit_weight: 120 }, // 1 filé médio
  { id: '8', name: 'Carne Moída (Refogada)', calories: 250, carbs: 0, protein: 26, fat: 15, sugar: 0, category: 'Proteina', unit_weight: 100 }, // 4 colheres sopa
  { id: '9', name: 'Bife de Vaca Grelhado', calories: 250, carbs: 0, protein: 26, fat: 15, sugar: 0, category: 'Proteina', unit_weight: 100 },
  { id: '10', name: 'Salmão Grelhado', calories: 206, carbs: 0, protein: 22, fat: 12, sugar: 0, category: 'Proteina', unit_weight: 150 }, // 1 posta
  { id: '11', name: 'Atum em Lata (Água)', calories: 116, carbs: 0, protein: 26, fat: 1, sugar: 0, category: 'Proteina', unit_weight: 120 }, // 1 lata escorrida
  { id: '12', name: 'Sardinha em Lata', calories: 208, carbs: 0, protein: 24, fat: 11, sugar: 0, category: 'Proteina', unit_weight: 85 }, // 1 lata peq
  { id: '13', name: 'Queijo Mussarela', calories: 280, carbs: 3, protein: 22, fat: 22, sugar: 0.5, category: 'Proteina', unit_weight: 20 }, // 1 fatia
  { id: '14', name: 'Queijo Minas/Fresco', calories: 264, carbs: 3, protein: 17, fat: 20, sugar: 3, category: 'Proteina', unit_weight: 30 }, // 1 fatia grossa
  { id: '15', name: 'Presunto Cozido', calories: 120, carbs: 1, protein: 16, fat: 5, sugar: 1, category: 'Salgada', unit_weight: 20 }, // 1 fatia
  { id: '16', name: 'Macarrão Cozido', calories: 157, carbs: 30, protein: 5, fat: 0.9, sugar: 0.5, category: 'Massa', unit_weight: 140 }, // 1 prato raso
  { id: '17', name: 'Puré de Batata', calories: 88, carbs: 15, protein: 2, fat: 2.8, sugar: 1, category: 'Salgada', unit_weight: 150 },
  { id: '18', name: 'Batata Frita', calories: 312, carbs: 41, protein: 3.4, fat: 15, sugar: 0.3, category: 'Salgada', unit_weight: 100 },
  { id: '19', name: 'Batata Doce Cozida', calories: 86, carbs: 20, protein: 1.6, fat: 0.1, sugar: 4, category: 'Carboidratos', unit_weight: 150 }, // 1 unidade média
  { id: '20', name: 'Cuscuz de Milho', calories: 112, carbs: 23, protein: 3.8, fat: 0.7, sugar: 0, category: 'Carboidratos', unit_weight: 100 },
  { id: '21', name: 'Tapioca (Massa)', calories: 235, carbs: 54, protein: 1.6, fat: 0, sugar: 0, category: 'Carboidratos', unit_weight: 100 }, // 1 disco
  { id: '22', name: 'Aveia em Flocos', calories: 389, carbs: 66, protein: 17, fat: 7, sugar: 0, category: 'Carboidratos', unit_weight: 30 }, // 2 colheres sopa
  { id: '23', name: 'Granola', calories: 471, carbs: 64, protein: 10, fat: 20, sugar: 20, category: 'Carboidratos', unit_weight: 40 }, // 1/4 xícara
  { id: '24', name: 'Pão Francês/Carcaça', calories: 300, carbs: 58, protein: 8, fat: 3, sugar: 2, category: 'Massa', unit_weight: 50 }, // 1 unidade
  { id: '25', name: 'Pão de Forma', calories: 260, carbs: 49, protein: 9, fat: 3, sugar: 4, category: 'Massa', unit_weight: 25 }, // 1 fatia
  { id: '26', name: 'Pão de Queijo', calories: 280, carbs: 25, protein: 10, fat: 16, sugar: 1, category: 'Salgada', unit_weight: 50 }, // 1 unidade média
  { id: '27', name: 'Coxinha de Frango', calories: 300, carbs: 28, protein: 10, fat: 16, sugar: 2, category: 'Salgada', unit_weight: 100 }, // 1 unidade média
  { id: '28', name: 'Pizza Mussarela', calories: 280, carbs: 30, protein: 12, fat: 10, sugar: 3, category: 'Massa', unit_weight: 120 }, // 1 fatia
  { id: '29', name: 'Hambúrguer (Pão+Carne)', calories: 295, carbs: 30, protein: 17, fat: 12, sugar: 5, category: 'Salgada', unit_weight: 180 },
  { id: '30', name: 'Banana Prata', calories: 98, carbs: 26, protein: 1.3, fat: 0.1, sugar: 15, category: 'Fruta', unit_weight: 80 },
  { id: '31', name: 'Maçã', calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sugar: 10, category: 'Fruta', unit_weight: 130 },
  { id: '32', name: 'Abacate', calories: 160, carbs: 9, protein: 2, fat: 15, sugar: 0.7, category: 'Fruta', unit_weight: 100 }, // meio pequeno
  { id: '33', name: 'Melancia', calories: 30, carbs: 8, protein: 0.6, fat: 0.2, sugar: 6, category: 'Fruta', unit_weight: 200 }, // 1 fatia
  { id: '34', name: 'Laranja', calories: 47, carbs: 12, protein: 1, fat: 0.1, sugar: 9, category: 'Fruta', unit_weight: 150 },
  { id: '35', name: 'Alface', calories: 15, carbs: 3, protein: 1.4, fat: 0.2, sugar: 0.8, category: 'Verdura', unit_weight: 20 }, // várias folhas
  { id: '36', name: 'Tomate', calories: 18, carbs: 4, protein: 0.9, fat: 0.2, sugar: 2.6, category: 'Verdura', unit_weight: 100 }, // 1 unidade
  { id: '37', name: 'Brócolis Cozido', calories: 35, carbs: 7, protein: 2.4, fat: 0.4, sugar: 1.4, category: 'Verdura', unit_weight: 80 }, // 1 xícara picada
  { id: '38', name: 'Cenoura Crua', calories: 41, carbs: 10, protein: 0.9, fat: 0.2, sugar: 4.7, category: 'Verdura', unit_weight: 70 }, // 1 média
  { id: '39', name: 'Chocolate ao Leite', calories: 535, carbs: 59, protein: 7, fat: 30, sugar: 50, category: 'Doce', unit_weight: 25 }, // 4 quadradinhos
  { id: '40', name: 'Chocolate Amargo 70%', calories: 580, carbs: 34, protein: 8, fat: 42, sugar: 24, category: 'Doce', unit_weight: 25 },
  { id: '41', name: 'Brigadeiro', calories: 380, carbs: 50, protein: 6, fat: 18, sugar: 45, category: 'Doce', unit_weight: 20 }, // 1 unidade festa
  { id: '42', name: 'Sorvete de Baunilha', calories: 207, carbs: 24, protein: 3.5, fat: 11, sugar: 21, category: 'Doce', unit_weight: 60 }, // 1 bola
  { id: '43', name: 'Açaí (com xarope)', calories: 110, carbs: 21, protein: 2, fat: 4, sugar: 18, category: 'Doce', unit_weight: 200 }, // 1 copo pequeno
  { id: '44', name: 'Mel', calories: 304, carbs: 82, protein: 0.3, fat: 0, sugar: 82, category: 'Doce', unit_weight: 20 }, // 1 colher sopa
  { id: '45', name: 'Água', calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 250 },
  { id: '46', name: 'Café sem Açúcar', calories: 2, carbs: 0, protein: 0.2, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 50 }, // 1 xícara
  { id: '47', name: 'Café com Açúcar', calories: 30, carbs: 8, protein: 0.2, fat: 0, sugar: 8, category: 'Bebida', unit_weight: 50 },
  { id: '48', name: 'Leite Integral', calories: 60, carbs: 4.8, protein: 3.2, fat: 3.3, sugar: 4.8, category: 'Bebida', unit_weight: 200 }, // 1 copo
  { id: '49', name: 'Suco de Laranja Natural', calories: 45, carbs: 10, protein: 0.7, fat: 0.2, sugar: 8.4, category: 'Bebida', unit_weight: 250 },
  { id: '50', name: 'Refrigerante Cola', calories: 42, carbs: 10.6, protein: 0, fat: 0, sugar: 10.6, category: 'Bebida', unit_weight: 350 }, // 1 lata
  { id: '51', name: 'Cerveja', calories: 43, carbs: 3.6, protein: 0.5, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 350 }, // 1 lata
  { id: '52', name: 'Whey Protein', calories: 400, carbs: 6, protein: 80, fat: 5, sugar: 2, category: 'Suplemento', unit_weight: 30 }, // 1 scoop
  { id: '53', name: 'Creatina', calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Suplemento', unit_weight: 5 },
  { id: '54', name: 'Azeite de Oliva', calories: 884, carbs: 0, protein: 0, fat: 100, sugar: 0, category: 'Salgada', unit_weight: 13 }, // 1 colher sopa
  { id: '55', name: 'Manteiga', calories: 717, carbs: 0.1, protein: 0.8, fat: 81, sugar: 0.1, category: 'Salgada', unit_weight: 10 }, // 1 ponta faca
  { id: '56', name: 'Ketchup', calories: 110, carbs: 26, protein: 2, fat: 0, sugar: 22, category: 'Salgada', unit_weight: 15 }, // 1 colher sopa
  { id: '57', name: 'Iogurte Natural', calories: 65, carbs: 5, protein: 4, fat: 3, sugar: 5, category: 'Bebida', unit_weight: 170 }, // 1 potinho
  { id: '58', name: 'Queijo Prato', calories: 350, carbs: 1, protein: 23, fat: 29, sugar: 0, category: 'Proteina', unit_weight: 20 }, // 1 fatia
  { id: '59', name: 'Requeijão Cremoso', calories: 250, carbs: 2, protein: 10, fat: 24, sugar: 0, category: 'Salgada', unit_weight: 30 }, // 1 colher sopa cheia
  { id: '60', name: 'Manteiga', calories: 717, carbs: 0, protein: 1, fat: 81, sugar: 0, category: 'Salgada', unit_weight: 10 }, // 1 ponta de faca
  { id: '61', name: 'Mamão Papaia', calories: 43, carbs: 11, protein: 0.5, fat: 0.1, sugar: 8, category: 'Fruta', unit_weight: 150 }, // Meio mamão peq
  { id: '62', name: 'Abacaxi', calories: 50, carbs: 13, protein: 0.5, fat: 0.1, sugar: 10, category: 'Fruta', unit_weight: 80 }, // 1 fatia
  { id: '63', name: 'Strogonoff de Frango', calories: 160, carbs: 4, protein: 18, fat: 10, sugar: 1, category: 'Proteina', unit_weight: 150 }, // 1 concha
  { id: '64', name: 'Carne de Panela c/ Batata', calories: 180, carbs: 10, protein: 18, fat: 8, sugar: 0, category: 'Proteina', unit_weight: 180 },
  { id: '65', name: 'Farofa de Mandioca', calories: 400, carbs: 80, protein: 2, fat: 10, sugar: 0, category: 'Carboidratos', unit_weight: 20 }, // 1 colher sopa
  { id: '66', name: 'Purê de Mandioquinha', calories: 110, carbs: 25, protein: 1, fat: 2, sugar: 1, category: 'Carboidratos', unit_weight: 120 },
  { id: '67', name: 'Lasanha Bolonhesa', calories: 160, carbs: 18, protein: 10, fat: 8, sugar: 2, category: 'Massa', unit_weight: 250 }, // 1 pedaço médio
  { id: '68', name: 'Pizza Calabresa', calories: 300, carbs: 28, protein: 11, fat: 16, sugar: 2, category: 'Massa', unit_weight: 120 }, // 1 fatia
  { id: '69', name: 'Couve Refogada', calories: 90, carbs: 6, protein: 3, fat: 6, sugar: 0, category: 'Verdura', unit_weight: 50 },
  { id: '70', name: 'Beterraba Cozida', calories: 43, carbs: 10, protein: 1.6, fat: 0.2, sugar: 7, category: 'Verdura', unit_weight: 80 },
  { id: '71', name: 'Abobrinha Refogada', calories: 25, carbs: 5, protein: 1, fat: 1, sugar: 2, category: 'Verdura', unit_weight: 100 },
  { id: '72', name: 'Pepino', calories: 15, carbs: 3.6, protein: 0.7, fat: 0.1, sugar: 1.7, category: 'Verdura', unit_weight: 50 },
  { id: '73', name: 'Castanha de Caju', calories: 553, carbs: 30, protein: 18, fat: 44, sugar: 6, category: 'Salgada', unit_weight: 30 }, // 1 punhado
  { id: '74', name: 'Amendoim Japonês', calories: 480, carbs: 40, protein: 15, fat: 25, sugar: 3, category: 'Salgada', unit_weight: 30 },
  { id: '75', name: 'Pipoca (com óleo)', calories: 450, carbs: 58, protein: 9, fat: 20, sugar: 0, category: 'Salgada', unit_weight: 50 }, // 1 saco médio
  { id: '76', name: 'Biscoito Recheado', calories: 480, carbs: 70, protein: 6, fat: 20, sugar: 35, category: 'Doce', unit_weight: 10 }, // 1 unidade
  { id: '77', name: 'Barra de Cereal', calories: 400, carbs: 75, protein: 6, fat: 10, sugar: 30, category: 'Doce', unit_weight: 25 }, // 1 unidade (25g = 100kcal)
  { id: '78', name: 'Sushi Salmão (Nigiri)', calories: 180, carbs: 35, protein: 10, fat: 2, sugar: 2, category: 'Proteina', unit_weight: 25 }, // 1 unidade (peq)
  { id: '79', name: 'Sashimi Salmão', calories: 200, carbs: 0, protein: 20, fat: 13, sugar: 0, category: 'Proteina', unit_weight: 15 }, // 1 fatia
  { id: '80', name: 'Temaki Salmão', calories: 160, carbs: 30, protein: 10, fat: 6, sugar: 1, category: 'Proteina', unit_weight: 150 }, // 1 unidade
  { id: '81', name: 'Água de Coco', calories: 19, carbs: 3.7, protein: 0.7, fat: 0.2, sugar: 2.6, category: 'Bebida', unit_weight: 200 },
  { id: '82', name: 'Cerveja (Lata)', calories: 43, carbs: 3.6, protein: 0.5, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 350 },
  { id: '83', name: 'Vinho Tinto', calories: 85, carbs: 2.6, protein: 0.1, fat: 0, sugar: 0.6, category: 'Bebida', unit_weight: 150 },
  { id: '84', name: 'Chá Mate (Industrial)', calories: 35, carbs: 9, protein: 0, fat: 0, sugar: 9, category: 'Bebida', unit_weight: 200 },
{ id: '85', name: 'Manga Palmer', calories: 72, carbs: 19, protein: 0.6, fat: 0.2, sugar: 15, category: 'Fruta', unit_weight: 350 },
  { id: '86', name: 'Pera', calories: 57, carbs: 15, protein: 0.4, fat: 0.1, sugar: 10, category: 'Fruta', unit_weight: 150 },
  { id: '87', name: 'Tangerina/Mexerica', calories: 53, carbs: 13, protein: 0.8, fat: 0.3, sugar: 9, category: 'Fruta', unit_weight: 100 },
  { id: '88', name: 'Kiwi', calories: 61, carbs: 15, protein: 1.1, fat: 0.5, sugar: 9, category: 'Fruta', unit_weight: 70 },
  { id: '89', name: 'Morango', calories: 32, carbs: 8, protein: 0.7, fat: 0.3, sugar: 5, category: 'Fruta', unit_weight: 20 },
  { id: '90', name: 'Iogurte Grego Natural', calories: 97, carbs: 2.5, protein: 9, fat: 5, sugar: 2.5, category: 'Proteina', unit_weight: 100 },
  { id: '91', name: 'Queijo Coalho', calories: 345, carbs: 2, protein: 24, fat: 27, sugar: 0, category: 'Proteina', unit_weight: 30 },
  { id: '92', name: 'Queijo Parmesão Ralado', calories: 431, carbs: 4, protein: 38, fat: 29, sugar: 0, category: 'Proteina', unit_weight: 10 },
  { id: '93', name: 'Mortadela', calories: 260, carbs: 4, protein: 12, fat: 22, sugar: 0, category: 'Proteina', unit_weight: 15 },
  { id: '94', name: 'Salsicha (Cozida)', calories: 300, carbs: 2, protein: 12, fat: 26, sugar: 0, category: 'Proteina', unit_weight: 50 },
  { id: '95', name: 'Peito de Peru', calories: 105, carbs: 2, protein: 22, fat: 1.5, sugar: 1, category: 'Proteina', unit_weight: 20 },
  { id: '96', name: 'Biscoito Maizena', calories: 440, carbs: 75, protein: 8, fat: 12, sugar: 25, category: 'Carboidratos', unit_weight: 5 },
  { id: '97', name: 'Biscoito Cream Cracker', calories: 430, carbs: 68, protein: 10, fat: 14, sugar: 2, category: 'Carboidratos', unit_weight: 6 },
  { id: '98', name: 'Torrada Industrializada', calories: 380, carbs: 70, protein: 11, fat: 7, sugar: 5, category: 'Carboidratos', unit_weight: 10 },
  { id: '99', name: 'Pão de Alho (Churrasco)', calories: 350, carbs: 35, protein: 6, fat: 20, sugar: 4, category: 'Carboidratos', unit_weight: 50 },
  { id: '100', name: 'Pastel de Carne Frito', calories: 380, carbs: 35, protein: 10, fat: 22, sugar: 1, category: 'Salgada', unit_weight: 100 },
  { id: '101', name: 'Pastel de Queijo Frito', calories: 390, carbs: 32, protein: 12, fat: 24, sugar: 1, category: 'Salgada', unit_weight: 100 },
  { id: '102', name: 'Kibe Frito', calories: 280, carbs: 20, protein: 15, fat: 15, sugar: 0, category: 'Salgada', unit_weight: 70 },
  { id: '103', name: 'Esfirra de Carne', calories: 260, carbs: 32, protein: 12, fat: 9, sugar: 3, category: 'Salgada', unit_weight: 80 },
  { id: '104', name: 'Empada de Frango', calories: 350, carbs: 30, protein: 10, fat: 20, sugar: 2, category: 'Salgada', unit_weight: 80 },
  { id: '105', name: 'Couve-Flor Cozida', calories: 25, carbs: 5, protein: 2, fat: 0.3, sugar: 2, category: 'Verdura', unit_weight: 100 },
  { id: '106', name: 'Espinafre Refogado', calories: 23, carbs: 4, protein: 3, fat: 0.4, sugar: 0, category: 'Verdura', unit_weight: 50 },
  { id: '107', name: 'Rúcula', calories: 25, carbs: 3.7, protein: 2.6, fat: 0.7, sugar: 2, category: 'Verdura', unit_weight: 30 },
  { id: '108', name: 'Milho Cozido', calories: 96, carbs: 21, protein: 3.4, fat: 1.5, sugar: 4.5, category: 'Verdura', unit_weight: 80 },
  { id: '109', name: 'Paçoca', calories: 485, carbs: 52, protein: 16, fat: 26, sugar: 45, category: 'Doce', unit_weight: 20 },
  { id: '110', name: 'Doce de Leite', calories: 315, carbs: 55, protein: 7, fat: 7, sugar: 50, category: 'Doce', unit_weight: 20 },
  { id: '111', name: 'Leite Condensado', calories: 320, carbs: 54, protein: 8, fat: 8, sugar: 54, category: 'Doce', unit_weight: 30 },
  { id: '112', name: 'Goiabada', calories: 300, carbs: 78, protein: 0.5, fat: 0, sugar: 70, category: 'Doce', unit_weight: 30 },
  { id: '113', name: 'Cappuccino (com açúcar)', calories: 80, carbs: 15, protein: 2, fat: 2, sugar: 14, category: 'Bebida', unit_weight: 150 },
  { id: '114', name: 'Chá Gelado (Industrial)', calories: 35, carbs: 9, protein: 0, fat: 0, sugar: 9, category: 'Bebida', unit_weight: 350 },
  { id: '115', name: 'Vodka (Dose)', calories: 231, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 50 },
  { id: '116', name: 'Whisky (Dose)', calories: 250, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 50 },
  { id: '117', name: 'Caipirinha (Limão/Açúcar)', calories: 200, carbs: 20, protein: 0.5, fat: 0.1, sugar: 18, category: 'Bebida', unit_weight: 200 },
  { id: '118', name: 'Barra de Proteína', calories: 350, carbs: 30, protein: 30, fat: 10, sugar: 5, category: 'Suplemento', unit_weight: 45 },
  { id: '119', name: 'BCAA (Pó)', calories: 20, carbs: 0, protein: 5, fat: 0, sugar: 0, category: 'Suplemento', unit_weight: 5 },
  { id: '120', name: 'Maltodextrina', calories: 380, carbs: 95, protein: 0, fat: 0, sugar: 10, category: 'Suplemento', unit_weight: 30 },
  { id: '121', name: 'Ameixa', calories: 46, carbs: 11, protein: 0.7, fat: 0.3, sugar: 10, category: 'Fruta', unit_weight: 60 },
  { id: '122', name: 'Caqui', calories: 70, carbs: 18, protein: 0.6, fat: 0.2, sugar: 12, category: 'Fruta', unit_weight: 150 },
  { id: '123', name: 'Figo', calories: 74, carbs: 19, protein: 0.8, fat: 0.3, sugar: 16, category: 'Fruta', unit_weight: 50 },
  { id: '124', name: 'Pêssego', calories: 39, carbs: 10, protein: 0.9, fat: 0.3, sugar: 8, category: 'Fruta', unit_weight: 100 },
  { id: '125', name: 'Cereja', calories: 50, carbs: 12, protein: 1, fat: 0.3, sugar: 8, category: 'Fruta', unit_weight: 5 },
  { id: '126', name: 'Framboesa', calories: 52, carbs: 12, protein: 1.2, fat: 0.7, sugar: 4, category: 'Fruta', unit_weight: 5 },
  { id: '127', name: 'Amora', calories: 43, carbs: 10, protein: 1.4, fat: 0.5, sugar: 5, category: 'Fruta', unit_weight: 5 },
  { id: '128', name: 'Maracujá (Polpa)', calories: 97, carbs: 23, protein: 2.2, fat: 0.7, sugar: 11, category: 'Fruta', unit_weight: 50 },
  { id: '129', name: 'Caju', calories: 43, carbs: 10, protein: 1, fat: 0.3, sugar: 6, category: 'Fruta', unit_weight: 80 },
  { id: '130', name: 'Jabuticaba', calories: 50, carbs: 13, protein: 0.6, fat: 0.2, sugar: 10, category: 'Fruta', unit_weight: 5 },
  { id: '131', name: 'Acerola', calories: 32, carbs: 8, protein: 0.4, fat: 0.3, sugar: 0, category: 'Fruta', unit_weight: 5 },
  { id: '132', name: 'Coco Seco', calories: 354, carbs: 15, protein: 3.3, fat: 33, sugar: 6, category: 'Fruta', unit_weight: 50 },
  { id: '133', name: 'Croissant', calories: 406, carbs: 46, protein: 8, fat: 21, sugar: 11, category: 'Massa', unit_weight: 60 },
  { id: '134', name: 'Pão de Leite', calories: 295, carbs: 50, protein: 8, fat: 6, sugar: 8, category: 'Massa', unit_weight: 30 },
  { id: '135', name: 'Pão Integral', calories: 252, carbs: 43, protein: 12, fat: 3, sugar: 4, category: 'Massa', unit_weight: 25 },
  { id: '136', name: 'Broa de Milho', calories: 330, carbs: 60, protein: 6, fat: 8, sugar: 15, category: 'Massa', unit_weight: 60 },
  { id: '137', name: 'Sonho de Padaria', calories: 300, carbs: 40, protein: 6, fat: 12, sugar: 20, category: 'Doce', unit_weight: 80 },
  { id: '138', name: 'Bolo de Fubá', calories: 350, carbs: 60, protein: 5, fat: 12, sugar: 30, category: 'Doce', unit_weight: 60 },
  { id: '139', name: 'Torrada Multigrãos', calories: 380, carbs: 65, protein: 14, fat: 7, sugar: 5, category: 'Massa', unit_weight: 10 },
  { id: '140', name: 'Cream Cheese', calories: 342, carbs: 4, protein: 6, fat: 34, sugar: 3, category: 'Salgada', unit_weight: 30 },
  { id: '141', name: 'Ricota', calories: 174, carbs: 3, protein: 11, fat: 13, sugar: 0.2, category: 'Proteina', unit_weight: 30 },
  { id: '142', name: 'Leite de Amêndoas', calories: 15, carbs: 0.6, protein: 0.6, fat: 1.2, sugar: 0, category: 'Bebida', unit_weight: 200 },
  { id: '143', name: 'Picanha (com gordura)', calories: 310, carbs: 0, protein: 18, fat: 25, sugar: 0, category: 'Proteina', unit_weight: 150 },
  { id: '144', name: 'Maminha', calories: 153, carbs: 0, protein: 21, fat: 7, sugar: 0, category: 'Proteina', unit_weight: 120 },
  { id: '145', name: 'Fraldinha', calories: 220, carbs: 0, protein: 19, fat: 15, sugar: 0, category: 'Proteina', unit_weight: 120 },
  { id: '146', name: 'Costela Bovina', calories: 380, carbs: 0, protein: 14, fat: 35, sugar: 0, category: 'Proteina', unit_weight: 200 },
  { id: '147', name: 'Linguiça Toscana', calories: 300, carbs: 1, protein: 14, fat: 26, sugar: 0, category: 'Proteina', unit_weight: 80 },
  { id: '148', name: 'Coração de Frango', calories: 207, carbs: 1, protein: 18, fat: 14, sugar: 0, category: 'Proteina', unit_weight: 10 },
  { id: '149', name: 'Pão de Alho', calories: 350, carbs: 40, protein: 6, fat: 20, sugar: 2, category: 'Massa', unit_weight: 60 },
  { id: '150', name: 'Carne Seca', calories: 320, carbs: 0, protein: 32, fat: 20, sugar: 0, category: 'Proteina', unit_weight: 100 },
  { id: '151', name: 'Bacon', calories: 540, carbs: 1.5, protein: 37, fat: 42, sugar: 0, category: 'Proteina', unit_weight: 15 },
  { id: '152', name: 'Lombo Suíno', calories: 160, carbs: 0, protein: 22, fat: 8, sugar: 0, category: 'Proteina', unit_weight: 120 },
  { id: '153', name: 'Batata Ruffles', calories: 540, carbs: 50, protein: 6, fat: 35, sugar: 1, category: 'Salgada', unit_weight: 50 }, // pacote peq
  { id: '154', name: 'Doritos', calories: 500, carbs: 60, protein: 7, fat: 26, sugar: 2, category: 'Salgada', unit_weight: 50 },
  { id: '155', name: 'Cheetos', calories: 480, carbs: 65, protein: 5, fat: 24, sugar: 2, category: 'Salgada', unit_weight: 40 },
  { id: '156', name: 'Pipoca Microondas', calories: 500, carbs: 55, protein: 8, fat: 30, sugar: 0, category: 'Salgada', unit_weight: 100 }, // pacote
  { id: '157', name: 'Nuggets de Frango', calories: 250, carbs: 15, protein: 14, fat: 15, sugar: 0, category: 'Proteina', unit_weight: 25 }, // 1 unidade
  { id: '158', name: 'Hambúrguer Big Mac', calories: 257, carbs: 20, protein: 13, fat: 14, sugar: 4, category: 'Salgada', unit_weight: 200 }, // peso aproximado (referencia)
  { id: '159', name: 'Cheeseburger Simples', calories: 300, carbs: 30, protein: 15, fat: 13, sugar: 6, category: 'Salgada', unit_weight: 150 },
  { id: '160', name: 'Milkshake Chocolate', calories: 160, carbs: 25, protein: 4, fat: 6, sugar: 22, category: 'Doce', unit_weight: 300 },
  { id: '161', name: 'Hot Dog Completo', calories: 290, carbs: 28, protein: 10, fat: 16, sugar: 4, category: 'Salgada', unit_weight: 200 },
  { id: '162', name: 'Feijoada Completa', calories: 160, carbs: 15, protein: 15, fat: 8, sugar: 0, category: 'Proteina', unit_weight: 250 },
  { id: '163', name: 'Strogonoff Carne', calories: 180, carbs: 5, protein: 18, fat: 12, sugar: 1, category: 'Proteina', unit_weight: 150 },
  { id: '164', name: 'Panqueca de Carne', calories: 220, carbs: 20, protein: 12, fat: 10, sugar: 1, category: 'Massa', unit_weight: 100 },
  { id: '165', name: 'Yakisoba', calories: 150, carbs: 20, protein: 8, fat: 6, sugar: 2, category: 'Massa', unit_weight: 250 },
  { id: '166', name: 'Acarajé', calories: 300, carbs: 25, protein: 10, fat: 20, sugar: 0, category: 'Salgada', unit_weight: 150 },
  { id: '167', name: 'Pamonha Doce', calories: 180, carbs: 30, protein: 3, fat: 6, sugar: 15, category: 'Doce', unit_weight: 150 },
  { id: '168', name: 'Canjica/Mungunzá', calories: 150, carbs: 25, protein: 4, fat: 5, sugar: 15, category: 'Doce', unit_weight: 150 },
  { id: '169', name: 'Pudim de Leite', calories: 200, carbs: 30, protein: 5, fat: 6, sugar: 28, category: 'Doce', unit_weight: 100 }, // 1 fatia
  { id: '170', name: 'Mousse de Maracujá', calories: 250, carbs: 35, protein: 4, fat: 10, sugar: 30, category: 'Doce', unit_weight: 100 },
  { id: '171', name: 'Bolo de Chocolate', calories: 370, carbs: 50, protein: 5, fat: 18, sugar: 35, category: 'Doce', unit_weight: 60 }, // 1 fatia
  { id: '172', name: 'Churros (Doce de Leite)', calories: 350, carbs: 50, protein: 4, fat: 15, sugar: 25, category: 'Doce', unit_weight: 100 },
  { id: '173', name: 'Gelatina', calories: 60, carbs: 14, protein: 1, fat: 0, sugar: 13, category: 'Doce', unit_weight: 100 },
  { id: '174', name: 'Paçoca', calories: 485, carbs: 52, protein: 16, fat: 26, sugar: 45, category: 'Doce', unit_weight: 20 }, // 1 rolha
  { id: '175', name: 'Pé de Moleque', calories: 500, carbs: 55, protein: 12, fat: 28, sugar: 40, category: 'Doce', unit_weight: 25 },
  { id: '176', name: 'Bala/Chiclete', calories: 380, carbs: 95, protein: 0, fat: 0, sugar: 95, category: 'Doce', unit_weight: 5 },
  { id: '177', name: 'Chocolate Branco', calories: 540, carbs: 59, protein: 6, fat: 32, sugar: 59, category: 'Doce', unit_weight: 25 },
  { id: '178', name: 'Palmito', calories: 28, carbs: 5, protein: 2, fat: 0.6, sugar: 1, category: 'Verdura', unit_weight: 50 },
  { id: '179', name: 'Azeitona', calories: 115, carbs: 6, protein: 0.8, fat: 10, sugar: 0, category: 'Salgada', unit_weight: 5 },
  { id: '180', name: 'Milho Verde (Lata)', calories: 90, carbs: 18, protein: 3, fat: 1, sugar: 3, category: 'Carboidratos', unit_weight: 130 },
  { id: '181', name: 'Ervilha (Lata)', calories: 80, carbs: 14, protein: 5, fat: 0.5, sugar: 2, category: 'Salgada', unit_weight: 130 },
  { id: '182', name: 'Vagem Cozida', calories: 35, carbs: 7, protein: 1.8, fat: 0.1, sugar: 2, category: 'Verdura', unit_weight: 80 },
  { id: '183', name: 'Quiabo Refogado', calories: 35, carbs: 7, protein: 2, fat: 0.2, sugar: 2, category: 'Verdura', unit_weight: 80 },
  { id: '184', name: 'Chuchu Cozido', calories: 19, carbs: 4, protein: 0.6, fat: 0.1, sugar: 1.5, category: 'Verdura', unit_weight: 100 },
  { id: '185', name: 'Rúcula', calories: 25, carbs: 3.6, protein: 2.6, fat: 0.6, sugar: 2, category: 'Verdura', unit_weight: 30 },
  { id: '186', name: 'Espinafre Refogado', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, sugar: 0.4, category: 'Verdura', unit_weight: 60 },
  { id: '187', name: 'Grão de Bico', calories: 164, carbs: 27, protein: 9, fat: 2.6, sugar: 4, category: 'Carboidratos', unit_weight: 100 },
  { id: '188', name: 'Lentilha', calories: 116, carbs: 20, protein: 9, fat: 0.4, sugar: 1, category: 'Salgada', unit_weight: 100 },
  { id: '189', name: 'Soja Cozida', calories: 173, carbs: 10, protein: 16, fat: 9, sugar: 3, category: 'Proteina', unit_weight: 100 },
  { id: '190', name: 'Chia (Semente)', calories: 486, carbs: 42, protein: 17, fat: 30, sugar: 0, category: 'Suplemento', unit_weight: 10 }, // 1 colher sopa
  { id: '191', name: 'Linhaça', calories: 534, carbs: 29, protein: 18, fat: 42, sugar: 1, category: 'Suplemento', unit_weight: 10 },
  { id: '192', name: 'Chá Mate (Industrial)', calories: 35, carbs: 9, protein: 0, fat: 0, sugar: 9, category: 'Bebida', unit_weight: 200 },
  { id: '193', name: 'Suco de Uva Integral', calories: 65, carbs: 15, protein: 0, fat: 0, sugar: 14, category: 'Bebida', unit_weight: 200 },
  { id: '194', name: 'Energético', calories: 45, carbs: 11, protein: 0, fat: 0, sugar: 11, category: 'Bebida', unit_weight: 250 },
  { id: '195', name: 'Água Tônica', calories: 35, carbs: 9, protein: 0, fat: 0, sugar: 9, category: 'Bebida', unit_weight: 350 },
  { id: '196', name: 'Toddynho/Achocolatado', calories: 85, carbs: 14, protein: 2, fat: 2, sugar: 13, category: 'Bebida', unit_weight: 200 },
  { id: '197', name: 'Whisky (Dose)', calories: 250, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 50 },
  { id: '198', name: 'Gin (Dose)', calories: 260, carbs: 0, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 50 },
  { id: '199', name: 'Caipirinha (Limão c/ açúcar)', calories: 260, carbs: 30, protein: 0.5, fat: 0.1, sugar: 25, category: 'Bebida', unit_weight: 200 },
  { id: '200', name: 'Água com Limão', calories: 5, carbs: 1, protein: 0, fat: 0, sugar: 0, category: 'Bebida', unit_weight: 200 },


];
