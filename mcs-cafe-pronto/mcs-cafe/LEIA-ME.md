# MCS Café

## 1. Criar o projeto e copiar os arquivos

```
npx create-expo-app@latest mcs-cafe --template blank
cd mcs-cafe
npx expo install react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @expo/vector-icons expo-haptics expo-status-bar react-dom react-native-web
npm install firebase @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install --fix
```

Copie para dentro da pasta criada: `App.js`, `app.json`, `eas.json`, `firebase.json`, `firestore.rules`, `.env.example` e a pasta `src/`.

## 2. Firebase

1. Authentication > Sign-in method > habilitar E-mail/senha.
2. Firestore Database > criar banco.
3. Project settings > Your apps > Web: copiar o firebaseConfig para o `.env` (copie de `.env.example`).
4. Firestore > Rules: colar o conteúdo de `firestore.rules` e publicar.

## 3. Primeiro administrador

1. Abra o app e crie uma conta.
2. No console do Firebase: Firestore > `usuarios` > seu documento > campo `role` > troque `cliente` por `admin`.
3. Reabra o app: aparecem Painel e Produtos. Em Produtos, use "Carregar cardápio de exemplo".
4. Para funcionários: mesma troca, usando `funcionario`.

## 4. Testar

```
npx expo start -c
```

## 5. Gerar o APK

```
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Ao terminar, o Expo mostra o link de download do APK e o QR Code (também na página do build em expo.dev).
