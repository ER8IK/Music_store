import seedrandom from 'seedrandom';

// Аккордовые прогрессии (в полутонах от тоники)
const CHORD_PROGRESSIONS = [
  [0, 5, 7, 5],      // I-IV-V-IV (классический рок)
  [0, 7, 9, 5],      // I-V-vi-IV (поп)
  [0, 9, 5, 7],      // I-vi-IV-V (50s progression)
  [0, 5, 0, 7],      // I-IV-I-V (блюз)
  [9, 5, 0, 7],      // vi-IV-I-V (чувствительная)
  [0, 3, 5, 7],      // I-iii-IV-V
];

// Гаммы (в полутонах)
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10]
};

// Ритмические паттерны (длительность в долях)
const RHYTHM_PATTERNS = [
  [1, 1, 0.5, 0.5, 1],           // Стандартный
  [0.5, 0.5, 1, 1, 0.5, 0.5],    // Быстрый
  [2, 1, 1],                      // Медленный
  [0.5, 0.5, 0.5, 0.5, 1, 1],    // Синкопированный
  [1, 0.5, 0.5, 1, 1],           // Умеренный
];

function combineSeed(baseSeed, index) {
  return (baseSeed * 1103515245 + index * 12345) >>> 0;
}

function getRandomItem(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

// Генерация мелодии на основе гаммы и аккордовой прогрессии
function generateMelody(rng, scale, chordProgression, numBars = 8) {
  const notes = [];
  const notesPerBar = 4;
  
  for (let bar = 0; bar < numBars; bar++) {
    const chordRoot = chordProgression[bar % chordProgression.length];
    
    for (let beat = 0; beat < notesPerBar; beat++) {
      // Выбираем ноту из гаммы, предпочитая ноты аккорда
      const isChordTone = rng() < 0.6; // 60% шанс взять ноту из аккорда
      
      let note;
      if (isChordTone) {
        // Берем ноту из текущего аккорда
        const chordNotes = [chordRoot, (chordRoot + 4) % 12, (chordRoot + 7) % 12];
        const scaleNote = getRandomItem(rng, chordNotes);
        const octaveOffset = Math.floor(rng() * 2); // 0 или 1 октава вверх
        note = scaleNote + 60 + (octaveOffset * 12); // MIDI note (C4 = 60)
      } else {
        // Берем любую ноту из гаммы
        const scaleNote = getRandomItem(rng, scale);
        const octaveOffset = Math.floor(rng() * 2);
        note = scaleNote + 60 + (octaveOffset * 12);
      }
      
      notes.push(note);
    }
  }
  
  return notes;
}

// Генерация басовой линии
function generateBassLine(rng, chordProgression, numBars = 8) {
  const notes = [];
  const beatsPerBar = 4;
  
  for (let bar = 0; bar < numBars; bar++) {
    const chordRoot = chordProgression[bar % chordProgression.length];
    
    // Бас играет корень аккорда
    for (let beat = 0; beat < beatsPerBar; beat++) {
      if (beat === 0 || rng() < 0.3) { // Корень на сильной доле
        notes.push(chordRoot + 36); // Низкая октава
      } else {
        notes.push(null); // Пауза
      }
    }
  }
  
  return notes;
}

// Генерация барабанного паттерна
function generateDrums(rng, numBars = 8) {
  const pattern = [];
  const beatsPerBar = 4;
  
  for (let bar = 0; bar < numBars; bar++) {
    for (let beat = 0; beat < beatsPerBar; beat++) {
      const kick = beat % 2 === 0; // Бочка на сильные доли
      const snare = beat % 2 === 1; // Снейр на слабые доли
      const hihat = rng() < 0.8;    // Хэт играет почти всегда
      
      pattern.push({ kick, snare, hihat });
    }
  }
  
  return pattern;
}

// Основная функция генерации музыки
export function generateMusicData({ songIndex, seed, locale }) {
  const musicSeed = combineSeed(seed, songIndex);
  const rng = seedrandom(musicSeed.toString());
  
  // Выбор параметров
  const scaleType = getRandomItem(rng, Object.keys(SCALES));
  const scale = SCALES[scaleType];
  const chordProgression = getRandomItem(rng, CHORD_PROGRESSIONS);
  const tempo = 80 + Math.floor(rng() * 60); // 80-140 BPM
  const numBars = 8 + Math.floor(rng() * 9); // 8-16 тактов
  
  // Генерация треков
  const melody = generateMelody(rng, scale, chordProgression, numBars);
  const bass = generateBassLine(rng, chordProgression, numBars);
  const drums = generateDrums(rng, numBars);
  
  return {
    tempo,
    scale: scaleType,
    numBars,
    tracks: {
      melody,
      bass,
      drums
    }
  };
}
