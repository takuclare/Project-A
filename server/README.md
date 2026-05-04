# Project A Server

Backend Node.js + Express.

## Instalar

```bash
npm install
copy .env.example .env
npm run dev
```

## Variables importantes

```env
OPENAI_API_KEY=sk-tu-clave-real
PORT=3001
```

## Endpoints

- `GET /health` comprueba si el servidor está activo.
- `POST /api/voice-chat` recibe audio y devuelve texto + audio en base64.
