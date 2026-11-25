#!/usr/bin/env bash
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
cd "$(dirname "$SRC")"
npx create-expo-app@latest mcs-cafe-app --template blank --yes
cd mcs-cafe-app
cp -r "$SRC/src" .
cp "$SRC/App.js" "$SRC/app.json" "$SRC/eas.json" "$SRC/firebase.json" "$SRC/firestore.rules" "$SRC/.env.example" .
[ -f .env ] || cp .env.example .env
npx expo install react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @expo/vector-icons expo-haptics expo-status-bar react-dom react-native-web
npm install firebase @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install --fix
echo
echo "Preencha o arquivo .env com as chaves do Firebase e rode: npx expo start -c"
