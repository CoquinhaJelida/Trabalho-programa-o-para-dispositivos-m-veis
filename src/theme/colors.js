export const lightTheme = {
  background: '#f3f4f6', // Fundo da tela
  card: '#ffffff',       // Fundo dos cards
  text: '#1f2937',       // Texto principal
  textSub: '#6b7280',    // Texto secundário
  primary: '#16a34a',    // Verde destaque
  
  // --- CORREÇÃO AQUI ---
  inputBg: '#e5e7eb',    // Antes era #ffffff (invisível). Agora é Cinza (visível).
  // ---------------------

  border: '#e5e7eb',     // Bordas
  tabBar: '#ffffff',     // Menu
  tabIcon: '#9ca3af',
  tabIconActive: '#16a34a',
  statusText: 'dark-content'
};

export const darkTheme = {
  background: '#111827',
  card: '#1f2937',
  text: '#f9fafb',
  textSub: '#9ca3af',
  primary: '#22c55e',
  inputBg: '#374151',    // Cinza escuro (já estava bom)
  border: '#374151',
  tabBar: '#1f2937',
  tabIcon: '#6b7280',
  tabIconActive: '#4ade80',
  statusText: 'light-content'
};