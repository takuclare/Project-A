import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';

const app = express();
const upload = multer({ dest: os.tmpdir() });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 3001;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'Project A server' });
});

app.post('/api/voice-chat', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'Falta OPENAI_API_KEY en server/.env'
    });
  }

  if (!audioFile) {
    return res.status(400).json({ error: 'No se recibió audio.' });
  }

  try {
    const ext = path.extname(audioFile.originalname || '') || '.m4a';
    const fixedPath = `${audioFile.path}${ext}`;
    fs.renameSync(audioFile.path, fixedPath);

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(fixedPath),
      model: TRANSCRIBE_MODEL,
      language: 'es'
    });

    const userText = transcription.text?.trim() || '';

    if (!userText) {
      fs.unlinkSync(fixedPath);
      return res.status(400).json({ error: 'No se pudo transcribir el audio.' });
    }

    const chat = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Eres una chica anime asistente de voz llamada Aiko. Respondes en español de forma natural, simpática y breve. No digas que eres un modelo de IA salvo que te lo pregunten directamente.'
        },
        { role: 'user', content: userText }
      ],
      max_tokens: 250
    });

    const assistantText = chat.choices?.[0]?.message?.content?.trim() || 'Perdona, no he podido responder.';

    const speech = await client.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: assistantText,
      response_format: 'mp3'
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    fs.unlinkSync(fixedPath);

    res.json({
      userText,
      assistantText,
      audioBase64,
      audioMimeType: 'audio/mpeg'
    });
  } catch (error) {
    console.error(error);
    if (audioFile?.path && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
    res.status(500).json({
      error: 'Error procesando la conversación de voz.',
      detail: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Project A server running on http://localhost:${PORT}`);
});
