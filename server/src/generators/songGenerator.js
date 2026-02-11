import seedrandom from 'seedrandom';
import { LOCALE_DATA } from '../data/localeData.js';

// Комбинирование seed и page/index для воспроизводимости
function combineSeed(baseSeed, index) {
  // MAD (Multiply-Add-Divide) операция для комбинирования
  return (baseSeed * 1103515245 + index * 12345) >>> 0;
}

// Получение случайного элемента из массива
function getRandomItem(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

// Генерация количества лайков на основе среднего значения
function generateLikes(rng, avgLikes) {
  if (avgLikes === 0) return 0;
  if (avgLikes >= 10) return 10;
  
  // Для дробных значений используем вероятностное распределение
  const wholePart = Math.floor(avgLikes);
  const fractionalPart = avgLikes - wholePart;
  
  // Базовое количество лайков
  let likes = wholePart;
  
  // Добавляем дополнительный лайк с вероятностью fractionalPart
  if (rng() < fractionalPart) {
    likes++;
  }
  
  return likes;
}

// Генерация названия песни
function generateSongTitle(rng, locale) {
  const data = LOCALE_DATA[locale];
  const prefix = getRandomItem(rng, data.songPrefixes);
  const noun = getRandomItem(rng, data.songNouns);
  return `${prefix} ${noun}`;
}

// Генерация имени исполнителя
function generateArtist(rng, locale) {
  const data = LOCALE_DATA[locale];
  
  // 50% шанс на группу, 50% на сольного исполнителя
  if (rng() > 0.5) {
    // Группа
    const word = getRandomItem(rng, data.bandWords);
    const noun = getRandomItem(rng, data.bandNouns);
    return `${word} ${noun}`;
  } else {
    // Сольный исполнитель
    const firstName = getRandomItem(rng, data.artistFirstNames);
    const lastName = getRandomItem(rng, data.artistLastNames);
    return `${firstName} ${lastName}`;
  }
}

// Генерация названия альбома
function generateAlbum(rng, locale) {
  const data = LOCALE_DATA[locale];
  
  // 30% шанс на сингл
  if (rng() < 0.3) {
    return 'Single';
  }
  
  const prefix = getRandomItem(rng, data.albumPrefixes);
  const noun = getRandomItem(rng, data.albumNouns);
  return `${prefix} ${noun}`;
}

// Генерация жанра
function generateGenre(rng, locale) {
  const data = LOCALE_DATA[locale];
  return getRandomItem(rng, data.genres);
}

// Генерация цвета для обложки
function generateColor(rng) {
  const hue = Math.floor(rng() * 360);
  const saturation = 60 + Math.floor(rng() * 40); // 60-100%
  const lightness = 40 + Math.floor(rng() * 30); // 40-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Генерация паттерна для обложки
function generatePattern(rng) {
  const patterns = ['gradient', 'stripes', 'dots', 'waves', 'geometric'];
  return getRandomItem(rng, patterns);
}

// Генерация отзыва
function generateReview(rng, locale) {
  const data = LOCALE_DATA[locale];
  const reviewLength = 2 + Math.floor(rng() * 4); // 2-5 предложений
  
  const sentences = [];
  for (let i = 0; i < reviewLength; i++) {
    const word1 = getRandomItem(rng, data.reviewWords);
    const word2 = getRandomItem(rng, data.reviewWords);
    
    if (locale === 'en_US') {
      sentences.push(`This song is ${word1} and ${word2}.`);
    } else if (locale === 'ru_RU') {
      sentences.push(`Эта песня ${word1} и ${word2}.`);
    } else if (locale === 'uk_UA') {
      sentences.push(`Ця пісня ${word1} та ${word2}.`);
    }
  }
  
  return sentences.join(' ');
}

// Генерация одной песни
function generateSong(index, baseSeed, locale, avgLikes) {
  const songSeed = combineSeed(baseSeed, index);
  const rng = seedrandom(songSeed.toString());
  
  // Генерация основных данных (зависят от seed и index)
  const title = generateSongTitle(rng, locale);
  const artist = generateArtist(rng, locale);
  const album = generateAlbum(rng, locale);
  const genre = generateGenre(rng, locale);
  
  // Генерация данных для обложки
  const coverColor = generateColor(rng);
  const coverSecondaryColor = generateColor(rng);
  const coverPattern = generatePattern(rng);
  
  // Генерация отзыва
  const review = generateReview(rng, locale);
  
  // Генерация лайков (отдельный RNG для независимости от других параметров)
  const likesSeed = combineSeed(baseSeed + 999999, index);
  const likesRng = seedrandom(likesSeed.toString());
  const likes = generateLikes(likesRng, avgLikes);
  
  return {
    index,
    title,
    artist,
    album,
    genre,
    likes,
    cover: {
      color: coverColor,
      secondaryColor: coverSecondaryColor,
      pattern: coverPattern
    },
    review
  };
}

// Генерация страницы песен
export function generateSongs({ page, pageSize, seed, locale, avgLikes }) {
  const songs = [];
  const startIndex = (page - 1) * pageSize + 1;
  
  for (let i = 0; i < pageSize; i++) {
    const index = startIndex + i;
    songs.push(generateSong(index, seed, locale, avgLikes));
  }
  
  return {
    songs,
    page,
    pageSize,
    totalPages: -1 // Бесконечная генерация
  };
}
