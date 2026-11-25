@echo off
set SRC=%~dp0
cd /d "%SRC%.."
call npx create-expo-app@latest mcs-cafe-app --template blank --yes
cd mcs-cafe-app
xcopy "%SRC%src" src /E /I /Y
copy /Y "%SRC%App.js" .
copy /Y "%SRC%app.json" .
copy /Y "%SRC%eas.json" .
copy /Y "%SRC%firebase.json" .
copy /Y "%SRC%firestore.rules" .
copy /Y "%SRC%.env.example" .env
call npx expo install react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @expo/vector-icons expo-haptics expo-status-bar react-dom react-native-web
call npm install firebase @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
call npx expo install --fix
echo.
echo Preencha o arquivo .env com as chaves do Firebase e rode: npx expo start -c
