import 'dotenv/config'; // Isso carrega as variáveis do seu arquivo .env

export default {
  expo: {
   "name": "Dieta",
    "slug": "Dieta",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.seuome.nutrilife" // Mude para seu ID real
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.seuome.nutrilife", // <--- MUITO IMPORTANTE: SEU ID ÚNICO (CHECK NO FIREBASE)
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          "photosPermission": "O app precisa acessar suas fotos para a galeria de evolução."
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "useAndroidX": true,
            "enableProguardInReleaseBuilds": true
          }
        }
      ]
    ],
    // --- AQUI A MÁGICA ACONTECE ---
    // O Expo lê do seu computador (process.env) e passa para o App (Constants.manifest.extra)
    extra: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      eas: {
        projectId: "38123815-f494-4cef-a91b-195055f4fe8a" // (Opcional: O EAS preenche isso sozinho no build)
      }
    }
  }
};