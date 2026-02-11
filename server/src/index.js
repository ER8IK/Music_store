import express from 'express';
import cors from 'cors';
import { generateSongs } from './generators/songGenerator.js';
import { generateMusicData } from './generators/musicGenerator.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API для получения страницы песен
app.get('/api/songs', (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    seed = 12345,
    locale = 'en_US',
    avgLikes = 5
  } = req.query;

  const songs = generateSongs({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    seed: parseInt(seed),
    locale,
    avgLikes: parseFloat(avgLikes)
  });

  res.json(songs);
});

// API для получения музыкальных данных (MIDI-подобная структура)
app.get('/api/music/:songIndex', (req, res) => {
  const { songIndex } = req.params;
  const { seed = 12345, locale = 'en_US' } = req.query;

  const musicData = generateMusicData({
    songIndex: parseInt(songIndex),
    seed: parseInt(seed),
    locale
  });

  res.json(musicData);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
