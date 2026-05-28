# Compilar APK de LogOS para Android

## Requisitos

- Node.js 18+
- Android Studio (con Android SDK instalado)
- Java 17+

## Setup inicial (solo la primera vez)

```bash
cd pwa
npm install
```

## Compilar APK debug (para testeo)

```bash
cd pwa
npm run android:build
```

El APK se genera en:
```
pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

## Flujo de desarrollo

```bash
# 1. Editar código en pwa/src/
# 2. Sincronizar con Android
npm run sync

# 3. Abrir Android Studio
npm run android:open
# → Desde Android Studio: Run → Run 'app'
```

## Compilar APK release (para distribuir)

```bash
cd pwa
npm run android:release
```

> Para APK release firmado, configurá tu keystore en
> `android/app/build.gradle` → signingConfigs

## Instalar APK directo en el celular (vía USB)

```bash
# Con el celular conectado por USB y depuración USB activada:
adb install pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

## Actualizar íconos

Editá las imágenes en `pwa/assets/` y corré:

```bash
cd pwa
npm run assets:generate
npm run sync
```

## Configuración de la app

| Propiedad      | Valor              |
|----------------|--------------------|
| App ID         | `com.logos.app`    |
| App Name       | `LogOS`            |
| Min SDK        | Android 7 (API 24) |
| Target SDK     | Android 15 (API 35)|
| Versión        | 1.0 (code: 1)      |
