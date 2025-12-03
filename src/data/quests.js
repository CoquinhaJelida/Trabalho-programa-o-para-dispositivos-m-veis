// src/data/quests.js

export const QUESTS = [
  {
    id: 'quest_w3',
    title: 'Hidratação Inicial',
    desc: 'Mantenha uma ofensiva de água por 3 dias.',
    target: 3,
    type: 'water_streak',
    xp: 100,
    icon: 'droplet',
    color: ['#3b82f6', '#1d4ed8']
  },
  {
    id: 'quest_w7',
    title: 'Mestre da Água',
    desc: 'Mantenha uma ofensiva de água por 7 dias.',
    target: 7,
    type: 'water_streak',
    xp: 300,
    icon: 'award', // Medalha diferente
    color: ['#3b82f6', '#1e3a8a']
  },
  {
    id: 'quest_f5',
    title: 'Iniciante no Jejum',
    desc: 'Complete 5 jejuns no total.',
    target: 5,
    type: 'total_fasts',
    xp: 150,
    icon: 'clock',
    color: ['#f59e0b', '#b45309']
  },
  {
    id: 'quest_f18',
    title: 'Guerreiro do Jejum',
    desc: 'Complete um único jejum de 18 horas.',
    target: 18 * 3600, 
    type: 'max_fast_time',
    xp: 500,
    icon: 'shield',
    color: ['#f59e0b', '#78350f']
  },
  {
    id: 'quest_m10',
    title: 'Diário Alimentar',
    desc: 'Registre 10 refeições no aplicativo.',
    target: 10,
    type: 'total_meals',
    xp: 100,
    icon: 'book',
    color: ['#10b981', '#047857']
  },
  {
    id: 'quest_m50',
    title: 'Nutricionista Amador',
    desc: 'Registre 50 refeições no total.',
    target: 50,
    type: 'total_meals',
    xp: 500,
    icon: 'star',
    color: ['#10b981', '#064e3b']
  }
];