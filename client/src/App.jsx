import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Heart, Music } from 'lucide-react';
import * as Tone from 'tone';
import './App.css';

const LOCALES = {
  en_US: 'English (USA)',
  ru_RU: 'Русский (Россия)',
  uk_UA: 'Українська (Україна)'
};

function App() {
  const [locale, setLocale] = useState('en_US');
  const [seed, setSeed] = useState(12345);
  const [avgLikes, setAvgLikes] = useState(5);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'gallery'
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [playingSong, setPlayingSong] = useState(null);
  const [synth, setSynth] = useState(null);

  const PAGE_SIZE = 20;

  // Инициализация синтезатора
  useEffect(() => {
    const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    polySynth.set({
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
    setSynth(polySynth);

    return () => {
      polySynth.dispose();
    };
  }, []);

  // Загрузка песен
  const loadSongs = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/songs?page=${pageNum}&pageSize=${PAGE_SIZE}&seed=${seed}&locale=${locale}&avgLikes=${avgLikes}`
      );
      const data = await response.json();
      
      if (viewMode === 'gallery' && pageNum > 1) {
        setSongs(prev => [...prev, ...data.songs]);
      } else {
        setSongs(data.songs);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
    setLoading(false);
  }, [seed, locale, avgLikes, viewMode]);

  // Начальная загрузка и перезагрузка при изменении параметров
  useEffect(() => {
    setPage(1);
    setExpandedRow(null);
    loadSongs(1);
  }, [seed, locale, avgLikes, viewMode]);

  // Загрузка новой страницы для таблицы
  useEffect(() => {
    if (viewMode === 'table' && page > 1) {
      loadSongs(page);
    }
  }, [page, viewMode]);

  // Бесконечная прокрутка для галереи
  useEffect(() => {
    if (viewMode !== 'gallery') return;

    const handleScroll = () => {
      if (loading) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        setPage(prev => {
          const newPage = prev + 1;
          loadSongs(newPage);
          return newPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode, loading, loadSongs]);

  // Генерация случайного seed
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 4294967296); // 2^32
    setSeed(randomSeed);
  };

  // Воспроизведение музыки
  const playMusic = async (songIndex) => {
    if (!synth) return;

    if (playingSong === songIndex) {
      // Остановка
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setPlayingSong(null);
      return;
    }

    try {
      // Загрузка музыкальных данных
      const response = await fetch(`/api/music/${songIndex}?seed=${seed}&locale=${locale}`);
      const musicData = await response.json();

      await Tone.start();

      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.bpm.value = musicData.tempo;

      const { melody, bass } = musicData.tracks;
      const beatDuration = '8n'; // Восьмая нота

      // Воспроизведение мелодии
      melody.forEach((note, i) => {
        if (note) {
          Tone.Transport.schedule((time) => {
            synth.triggerAttackRelease(
              Tone.Frequency(note, 'midi').toNote(),
              beatDuration,
              time
            );
          }, i * Tone.Time(beatDuration).toSeconds());
        }
      });

      // Воспроизведение баса
      bass.forEach((note, i) => {
        if (note) {
          Tone.Transport.schedule((time) => {
            synth.triggerAttackRelease(
              Tone.Frequency(note, 'midi').toNote(),
              beatDuration,
              time,
              0.5 // Тише мелодии
            );
          }, i * Tone.Time(beatDuration).toSeconds());
        }
      });

      // Остановка в конце
      const duration = Math.max(melody.length, bass.length) * Tone.Time(beatDuration).toSeconds();
      Tone.Transport.schedule(() => {
        Tone.Transport.stop();
        setPlayingSong(null);
      }, duration);

      Tone.Transport.start();
      setPlayingSong(songIndex);
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  // Переключение развёрнутой строки
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <div className="app">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontFamily: 'Bebas Neue, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem'
        }}>
          MUSIC STORE
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Infinite Random Song Generator</p>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">Language</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)}>
            {Object.entries(LOCALES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Seed</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              style={{ flex: 1 }}
            />
            <button onClick={generateRandomSeed} style={{ padding: '0.75rem' }}>
              Random
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Avg Likes (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={avgLikes}
            onChange={(e) => setAvgLikes(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">View Mode</label>
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={viewMode === 'gallery' ? 'active' : ''}
              onClick={() => setViewMode('gallery')}
            >
              Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Genre</th>
                  <th>Likes</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <>
                    <tr key={song.index} onClick={() => toggleRow(song.index)}>
                      <td className="song-index">{song.index}</td>
                      <td className="song-title">{song.title}</td>
                      <td>{song.artist}</td>
                      <td>{song.album}</td>
                      <td>{song.genre}</td>
                      <td>
                        <div className="likes">
                          <Heart size={16} fill="currentColor" />
                          {song.likes}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === song.index && (
                      <tr className="expanded-row">
                        <td colSpan="6">
                          <SongDetails song={song} onPlay={() => playMusic(song.index)} isPlaying={playingSong === song.index} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Previous
            </button>
            <button className="active">{page}</button>
            <button onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </>
      )}

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="gallery">
          {songs.map((song) => (
            <div
              key={`${song.index}-${page}`}
              className="gallery-card"
              onClick={() => toggleRow(song.index)}
              style={{ animationDelay: `${(song.index % PAGE_SIZE) * 0.05}s` }}
            >
              <AlbumCover song={song} className="gallery-cover" />
              <div className="gallery-info">
                <div className="gallery-index">#{song.index}</div>
                <div className="gallery-title">{song.title}</div>
                <div className="gallery-artist">{song.artist}</div>
                <div className="gallery-meta">
                  <span>{song.genre}</span>
                  <span className="likes">
                    <Heart size={14} fill="currentColor" />
                    {song.likes}
                  </span>
                </div>
              </div>
              {expandedRow === song.index && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <SongDetails song={song} onPlay={() => playMusic(song.index)} isPlaying={playingSong === song.index} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
}

// Компонент обложки альбома
function AlbumCover({ song, className = '' }) {
  return (
    <div className={`album-cover ${className}`}>
      <div
        className={`cover-background ${song.cover.pattern}`}
        style={{
          '--color1': song.cover.color,
          '--color2': song.cover.secondaryColor
        }}
      >
        <div className="cover-title">{song.title}</div>
        <div className="cover-artist">{song.artist}</div>
      </div>
    </div>
  );
}

// Компонент деталей песни
function SongDetails({ song, onPlay, isPlaying, compact = false }) {
  if (compact) {
    return (
      <>
        <button className="play-button" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <div className="review" style={{ fontSize: '0.85rem' }}>{song.review}</div>
      </>
    );
  }

  return (
    <div className="song-details">
      <AlbumCover song={song} />
      <div className="song-info">
        <h2>{song.title}</h2>
        <div className="song-meta">
          <span><strong>Artist:</strong> {song.artist}</span>
          <span><strong>Album:</strong> {song.album}</span>
          <span><strong>Genre:</strong> {song.genre}</span>
        </div>
        <button className="play-button" onClick={onPlay}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? 'Stop Preview' : 'Play Preview'}
        </button>
        <div className="review">{song.review}</div>
      </div>
    </div>
  );
}

export default App;
