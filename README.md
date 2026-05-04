# Project A — Anime Voice Assistant

MVP inicial de una app Android con Expo + backend Node/Express.

## Qué hace esta versión

- App móvil con avatar anime simple.
- Botón para grabar voz.
- Envía el audio al backend.
- El backend transcribe con OpenAI.
- Genera una respuesta de ChatGPT.
- Convierte la respuesta a voz.
- La app reproduce el audio y cambia la imagen del avatar mientras habla.

## Estructura

```txt
Project-A/
├─ server/   Backend seguro con Express. Aquí va tu API key.
└─ mobile/   App Android con Expo.
```

## Requisitos

Instala en tu PC:

1. Node.js LTS
2. Visual Studio Code
3. Git
4. GitHub Desktop, opcional
5. Expo Go en tu móvil Android

## Paso 1 — Backend

Abre una terminal en la carpeta `server`:

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

En Windows PowerShell, si `copy` no funciona, usa:

```powershell
Copy-Item .env.example .env
```

Edita `server/.env` y pon tu clave real:

```env
OPENAI_API_KEY=sk-tu-clave-real
PORT=3001
```

Si todo va bien, verás:

```txt
Project A server running on http://localhost:3001
```

## Paso 2 — App móvil

Abre otra terminal en la carpeta `mobile`:

```bash
cd mobile
npm install
copy .env.example .env
npm start
```

Edita `mobile/.env` y pon la IP local de tu PC:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.50:3001
```

Para saber tu IP en Windows:

```bash
ipconfig
```

Busca `Dirección IPv4`.

## Paso 3 — Probar en Android

1. Instala Expo Go desde Google Play.
2. Ejecuta `npm start` dentro de `mobile`.
3. Escanea el QR con Expo Go.
4. Pulsa el botón de grabar.
5. Habla.
6. Pulsa parar.
7. Espera la respuesta de voz.

## Notas importantes

- No metas nunca la API key de OpenAI dentro de `mobile`.
- La API key solo va en `server/.env`.
- El backend debe estar encendido para que la app funcione.
- Tu móvil y tu PC deben estar en la misma red WiFi.

## Siguiente fase

Cuando este MVP funcione, se puede mejorar con:

- Comunicación de voz en tiempo real con WebRTC.
- Avatar Live2D o Rive.
- Personalidad fija para la chica anime.
- Memoria de conversación.
- Modo manos libres.
