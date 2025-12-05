// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// O Firebase usa arquivos .cjs e o Metro padrão não lê. Isso corrige:
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = defaultConfig;