const { exec, spawn } = require('child_process');
const path = require('path');
const ytSearch = require('yt-search');
const fs = require('fs');
const https = require('https');

// Ensure axios is available globally in this module
let axios;
try {
    axios = require('axios');
} catch (e) {
    console.error('[ytdl] Failed to require axios:', e.message);
}

/**
 * Enhanced YouTube Search
 */
async function yt_search(src) {
  try {
    const r = await ytSearch(src);
    const videos = r.videos ? r.videos : (r.url ? [r] : []);
    return videos.map(v => ({
      url: v.url || 'Unknown',
      title: v.title || 'No Title',
      duration: v.timestamp || v.duration?.timestamp || '0:00',
      thumbnail: v.thumbnail || v.image || '',
      author: v.author?.name || v.author || 'Unknown'
    }));
  } catch (err) {
    console.error('[ytdl] Search error:', err.message);
    return [];
  }
}

/**
 * HYPER-ROBUST COBALT (Proxied Links)
 */
async function Cobalt(url, isAudio = false) {
  if (!axios) axios = require('axios');
  const instances = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.hypert.top/api/json',
    'https://cobalt.k6.nl/api/json',
    'https://api.cobalt.sh/api/json',
    'https://cobalt.inst.mobi/api/json',
    'https://cobalt.pwned.nu/api/json'
  ];

  for (const instance of instances) {
    try {
      console.log(`[ytdl] Trying instance: ${instance}`);
      const res = await axios.post(instance, {
        url: url,
        downloadMode: isAudio ? 'audio' : 'video',
        videoQuality: '720',
        audioFormat: 'mp3',
        filenameStyle: 'basic'
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      if (res.data && res.data.url) {
        return { link: res.data.url, title: res.data.filename || 'Cobalt Download', isStream: false };
      }
    } catch (err) {
      console.error(`[ytdl] Cobalt error on ${instance}:`, err.message);
    }
  }
  return null;
}

/**
 * HYPER-ROBUST STREAM ENGINE (No-Save)
 */
async function StreamYT(url, isAudio = false, quality = '360') {
  return new Promise((resolve) => {
    try {
      const ffmpegPath = 'c:\\Users\\abdo\\Downloads\\Telegram Desktop\\xl-Boot\\271k\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
      
      // Determine height for video
      const height = isAudio ? '' : (quality || '360');
      
      const args = [
        '-m', 'yt_dlp',
        '--quiet', '--no-warnings', '--no-playlist',
        '--ffmpeg-location', ffmpegPath,
        // The ? Makes the filter optional (best effort)
        '-f', isAudio ? 'bestaudio/best' : `bestvideo[height<=?${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=?${height}]/best`,
        '-o', '-',
        url
      ];

      console.log(`[StreamYT] Spawning with quality ${height}p: python ${args.join(' ')}`);
      const proc = spawn('python', args);
      
      if (!proc || !proc.stdout) {
          throw new Error("Failed to spawn python process");
      }

      // Return stream immediately
      resolve({ stream: proc.stdout, title: 'YouTube Stream', isStream: true });
      
      if (proc.stderr) {
        proc.stderr.on('data', (chunk) => {
          if (!chunk) return;
          const msg = String(chunk);
          if (msg.includes('ERROR')) console.error('[StreamYT] stderr:', msg);
        });
      }

      proc.on('error', (err) => {
        console.error('[StreamYT] Process Global Error:', err.message);
      });

    } catch (e) {
      console.error('[StreamYT] Catch Error:', e.message);
      resolve(null);
    }
  });
}

/**
 * SMART DOWNLOADER ORCHESTRATOR
 */
async function SmartDownload(url, type = 'audio', quality = '360') {
  const isAudio = type === 'audio';
  
  // Attempt 1: Cobalt
  try {
    const cobalt = await Cobalt(url, isAudio);
    if (cobalt?.link) return cobalt;
  } catch (e) {}

  // Attempt 2: Stream
  try {
    const stream = await StreamYT(url, isAudio, quality);
    if (stream?.stream) return stream;
  } catch (e) {}

  throw new Error('All no-save download sources failed or were blocked');
}

module.exports = {
  SmartDownload,
  yt_search
}
