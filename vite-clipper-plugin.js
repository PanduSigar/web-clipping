import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Gagal mengunduh berkas. Kode Status: ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
      });
      file.on('close', () => {
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export default function viteClipperPlugin() {
  return {
    name: 'vite-plugin-youtube-clipper',
    configureServer(server) {
      // API endpoint to download and clip the YouTube video
      server.middlewares.use('/api/clip-video', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { url, start, end, title } = JSON.parse(body);
              if (!url) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'URL video tidak boleh kosong.' }));
                return;
              }

              // Create bin folder if not exists
              const binDir = path.resolve('bin');
              if (!fs.existsSync(binDir)) {
                fs.mkdirSync(binDir);
              }

              const ytDlpPath = path.join(binDir, 'yt-dlp.exe');
              
              // Download yt-dlp.exe if missing
              if (!fs.existsSync(ytDlpPath)) {
                console.log('[Clipper API] Mengunduh yt-dlp.exe...');
                const tempPath = ytDlpPath + '.temp';
                try {
                  await downloadFile('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', tempPath);
                  
                  // Resilient rename with retries for Windows environments
                  let renamed = false;
                  let lastRenameError = null;
                  for (let i = 0; i < 6; i++) {
                    try {
                      if (fs.existsSync(ytDlpPath)) {
                        fs.unlinkSync(ytDlpPath);
                      }
                      fs.renameSync(tempPath, ytDlpPath);
                      renamed = true;
                      break;
                    } catch (renameErr) {
                      lastRenameError = renameErr;
                      console.warn(`[Clipper API] Gagal me-rename file, mencoba kembali dalam 500ms... (Percobaan ${i+1}/6):`, renameErr.message);
                      await new Promise(r => setTimeout(r, 500));
                    }
                  }
                  if (!renamed) {
                    throw new Error(`Gagal memindahkan file temporer ke file exe final karena terkunci oleh sistem: ${lastRenameError?.message}`);
                  }
                  
                  console.log('[Clipper API] yt-dlp.exe berhasil diunduh.');
                } catch (dlErr) {
                  console.error('[Clipper API] Gagal mengunduh yt-dlp.exe:', dlErr);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal memasang mesin pengunduh yt-dlp: ' + dlErr.message }));
                  return;
                }
              }

              // Create unique output file name
              const outputDir = path.resolve('clips');
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
              }
              const safeTitle = (title || 'clip').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
              const fileName = `${safeTitle}_${Date.now()}.mp4`;
              const outputPath = path.join(outputDir, fileName);

              console.log(`[Clipper API] Mengambil URL langsung untuk video: ${url}`);
              
              const getUrlArgs = [
                '-g',
                '-f', 'best[height<=720][ext=mp4]/best[ext=mp4]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best',
                url
              ];

              let ytDlpGetUrl;
              try {
                ytDlpGetUrl = spawn(ytDlpPath, getUrlArgs);
              } catch (e) {
                console.error('[Clipper API] Gagal spawn yt-dlp:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Gagal menjalankan engine pengunduh: ' + e.message }));
                return;
              }

              ytDlpGetUrl.on('error', (err) => {
                console.error('[Clipper API] Error pada proses yt-dlp:', err.message);
                if (!res.headersSent) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Terjadi error pada engine pengunduh: ' + err.message }));
                }
              });

              let urlStdout = '';
              let urlStderr = '';

              ytDlpGetUrl.stdout.on('data', (data) => {
                urlStdout += data.toString();
              });

              ytDlpGetUrl.stderr.on('data', (data) => {
                urlStderr += data.toString();
              });

              ytDlpGetUrl.on('close', (code) => {
                if (code !== 0) {
                  console.error(`[Clipper API] Gagal mendapatkan URL streaming. Kode keluar: ${code}. Log:\n${urlStderr}`);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal mendapatkan URL streaming video dari YouTube.', details: urlStderr }));
                  return;
                }

                const urls = urlStdout.split('\n')
                  .map(line => line.trim())
                  .filter(line => line.startsWith('http'));

                if (urls.length === 0) {
                  console.error(`[Clipper API] URL streaming kosong. Output stdout:\n${urlStdout}`);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal mendapatkan URL streaming video dari YouTube.' }));
                  return;
                }

                const duration = end - start;
                let ffmpegArgs = [];

                if (urls.length === 1) {
                  console.log(`[Clipper API] Memotong single stream: [Detik: ${start} s.d. ${end}]`);
                  ffmpegArgs = [
                    '-y',
                    '-ss', start.toString(),
                    '-i', urls[0],
                    '-t', duration.toString(),
                    '-c:v', 'libx264',
                    '-preset', 'superfast',
                    '-crf', '22',
                    '-c:a', 'aac',
                    outputPath
                  ];
                } else {
                  console.log(`[Clipper API] Memotong dual stream (video + audio): [Detik: ${start} s.d. ${end}]`);
                  ffmpegArgs = [
                    '-y',
                    '-ss', start.toString(),
                    '-i', urls[0], // Video
                    '-ss', start.toString(),
                    '-i', urls[1], // Audio
                    '-t', duration.toString(),
                    '-map', '0:v:0',
                    '-map', '1:a:0',
                    '-c:v', 'libx264',
                    '-preset', 'superfast',
                    '-crf', '22',
                    '-c:a', 'aac',
                    outputPath
                  ];
                }

                console.log(`[Clipper API] Menjalankan FFmpeg untuk pemotongan presisi...`);
                let ffmpegProcess;
                try {
                  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
                } catch (e) {
                  console.error('[Clipper API] Gagal spawn ffmpeg:', e.message);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal menjalankan FFmpeg untuk pemotongan video: ' + e.message }));
                  return;
                }

                ffmpegProcess.on('error', (err) => {
                  console.error('[Clipper API] Error pada FFmpeg process:', err.message);
                  if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Terjadi error pada FFmpeg process: ' + err.message }));
                  }
                });

                let ffmpegLog = '';
                ffmpegProcess.stdout.on('data', (data) => {
                  ffmpegLog += data.toString();
                });
                ffmpegProcess.stderr.on('data', (data) => {
                  ffmpegLog += data.toString();
                });

                ffmpegProcess.on('close', (ffmpegCode) => {
                  if (ffmpegCode === 0 && fs.existsSync(outputPath)) {
                    console.log(`[Clipper API] Video berhasil dipotong: ${outputPath}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                      success: true, 
                      fileName: fileName,
                      downloadUrl: `/api/download-clip-file?file=${fileName}` 
                    }));
                  } else {
                    console.error(`[Clipper API] FFmpeg keluar dengan kode ${ffmpegCode}. Log:\n${ffmpegLog}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                      success: false, 
                      error: `Gagal memproses pemotongan video via FFmpeg. Kode keluar: ${ffmpegCode}`,
                      log: ffmpegLog
                    }));
                  }
                });
              });

            } catch (err) {
              console.error('[Clipper API] Terjadi kesalahan saat memproses:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // API endpoint to serve/stream a local video file from disk (CORS/Security bypass)
      server.middlewares.use('/api/serve-local-video', (req, res, next) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const filePath = urlObj.searchParams.get('path');
          if (!filePath) {
            res.writeHead(400);
            res.end('Path parameter is missing');
            return;
          }

          const cleanPath = filePath.replace(/^"|"$/g, '').trim();
          if (!fs.existsSync(cleanPath)) {
            res.writeHead(404);
            res.end('File not found');
            return;
          }

          const stat = fs.statSync(cleanPath);
          const fileSize = stat.size;
          const range = req.headers.range;

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(cleanPath, { start, end });
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(cleanPath).pipe(res);
          }
        } catch (err) {
          console.error('[Clipper API] Error streaming local video:', err);
          res.writeHead(500);
          res.end(err.message);
        }
      });

      // API endpoint to fetch duration of a local disk video file using ffprobe
      server.middlewares.use('/api/local-video-duration', (req, res, next) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const filePath = urlObj.searchParams.get('path');
          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Path tidak boleh kosong.' }));
            return;
          }

          const cleanPath = filePath.replace(/^"|"$/g, '').trim();
          if (!fs.existsSync(cleanPath)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Berkas video tidak ditemukan pada disk lokal.' }));
            return;
          }

          // Spawn ffprobe to read duration
          let ffprobe;
          try {
            const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', cleanPath];
            ffprobe = spawn('ffprobe', args);
            ffprobe.on('error', (err) => {
              console.warn('[Clipper API] ffprobe error event:', err.message);
            });
          } catch (e) {
            console.warn('[Clipper API] Gagal spawn ffprobe:', e.message);
          }
          
          let stdout = '';
          let stderr = '';

          if (ffprobe) {
            ffprobe.stdout.on('data', d => stdout += d.toString());
            ffprobe.stderr.on('data', d => stderr += d.toString());

            ffprobe.on('close', (code) => {
              if (code === 0) {
                const duration = parseFloat(stdout.trim());
                if (!isNaN(duration)) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, duration }));
                  return;
                }
              }
              runFfmpegFallback();
            });
          } else {
            runFfmpegFallback();
          }

          function runFfmpegFallback() {
            let ffmpegProcess;
            try {
              ffmpegProcess = spawn('ffmpeg', ['-i', cleanPath]);
              ffmpegProcess.on('error', (err) => {
                console.error('[Clipper API] Gagal menjalankan ffmpeg fallback:', err.message);
                if (!res.headersSent) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal mendeteksi durasi berkas video dari disk: FFmpeg tidak terpasang.' }));
                }
              });
            } catch (e) {
              console.error('[Clipper API] Gagal spawn ffmpeg fallback:', e.message);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Gagal mendeteksi durasi berkas video dari disk: FFmpeg tidak terpasang.' }));
              }
              return;
            }

            if (ffmpegProcess) {
              let ffmpegErr = '';
              ffmpegProcess.stderr.on('data', d => ffmpegErr += d.toString());
              ffmpegProcess.on('close', () => {
                const match = ffmpegErr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
                if (match) {
                  const hours = parseInt(match[1], 10);
                  const minutes = parseInt(match[2], 10);
                  const seconds = parseFloat(match[3]);
                  const duration = (hours * 3600) + (minutes * 60) + seconds;
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, duration }));
                } else {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal mendeteksi durasi berkas video dari disk.', details: stderr || ffmpegErr }));
                }
              });
            }
          }
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // API endpoint to clip a local video directly from a disk path (blazing fast, no upload)
      server.middlewares.use('/api/clip-local-video-path', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { filePath, start, end, title } = JSON.parse(body);
              if (!filePath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Path berkas tidak boleh kosong.' }));
                return;
              }

              const cleanPath = filePath.replace(/^"|"$/g, '').trim();
              if (!fs.existsSync(cleanPath)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Berkas tidak ditemukan di path: ${cleanPath}` }));
                return;
              }

              const outputDir = path.resolve('clips');
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
              }

              const safeTitle = (title || 'clip').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
              const fileName = `${safeTitle}_${Date.now()}.mp4`;
              const outputPath = path.join(outputDir, fileName);

              const duration = end - start;
              
              // Trial 1: Stream Copy (Sub-second processing, ignores dimensions/audio failures)
              const copyArgs = [
                '-y',
                '-ss', start.toString(),
                '-i', cleanPath,
                '-t', duration.toString(),
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                outputPath
              ];

              console.log(`[Clipper API] Memotong video lokal dari path (Percobaan 1: Stream Copy): ${cleanPath}`);
              runFfmpeg(copyArgs, true);

              function runFfmpeg(ffmpegArgs, isFirstAttempt) {
                let ffmpegProcess;
                try {
                  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
                } catch (e) {
                  console.error('[Clipper API] Gagal spawn ffmpeg untuk local path:', e.message);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal menjalankan FFmpeg: ' + e.message }));
                  return;
                }

                let logOutput = '';
                ffmpegProcess.stdout.on('data', (data) => {
                  logOutput += data.toString();
                });
                ffmpegProcess.stderr.on('data', (data) => {
                  logOutput += data.toString();
                });

                ffmpegProcess.on('error', (err) => {
                  console.error('[Clipper API] Error FFmpeg pada local path:', err.message);
                  if (isFirstAttempt) {
                    fallbackToTranscode();
                  } else if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Terjadi error pada FFmpeg local path process: ' + err.message }));
                  }
                });

                ffmpegProcess.on('close', (code) => {
                  if (code === 0 && fs.existsSync(outputPath)) {
                    console.log(`[Clipper API] Video berhasil dipotong: ${outputPath}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                      success: true, 
                      fileName: fileName,
                      downloadUrl: `/api/download-clip-file?file=${fileName}` 
                    }));
                  } else {
                    if (isFirstAttempt) {
                      console.warn(`[Clipper API] Stream Copy gagal dengan kode ${code}. Mencoba fallback ke Transcoding...`);
                      fallbackToTranscode();
                    } else {
                      console.error(`[Clipper API] FFmpeg keluar dengan kode ${code}. Log:\n${logOutput}`);
                      res.writeHead(500, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ 
                        success: false, 
                        error: `Gagal memproses pemotongan video dari path. Kode keluar: ${code}`,
                        log: logOutput
                      }));
                    }
                  }
                });
              }

              function fallbackToTranscode() {
                const transcodeArgs = [
                  '-y',
                  '-ss', start.toString(),
                  '-i', cleanPath,
                  '-t', duration.toString(),
                  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Prevent h264 odd-dimension crashes
                  '-c:v', 'libx264',
                  '-preset', 'superfast',
                  '-crf', '22',
                  '-pix_fmt', 'yuv420p', // Browser compatible pixel format
                  '-c:a', 'aac',
                  '-map', '0:v:0',
                  '-map', '0:a?', // Optional audio stream mapping
                  outputPath
                ];
                console.log(`[Clipper API] Memotong video lokal dari path (Percobaan 2: Transcoding): ${cleanPath}`);
                runFfmpeg(transcodeArgs, false);
              }

            } catch (err) {
              console.error('[Clipper API] Error memotong dari path:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // API endpoint to clip a local uploaded video file
      server.middlewares.use('/api/clip-local-video', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const start = parseFloat(urlObj.searchParams.get('start') || '0');
            const end = parseFloat(urlObj.searchParams.get('end') || '0');
            const title = urlObj.searchParams.get('title') || 'clip';
            
            const binDir = path.resolve('bin');
            if (!fs.existsSync(binDir)) {
              fs.mkdirSync(binDir);
            }
            
            const outputDir = path.resolve('clips');
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir);
            }

            const tempUploadPath = path.join(binDir, `temp_upload_${Date.now()}.mp4`);
            const writeStream = fs.createWriteStream(tempUploadPath);
            
            req.pipe(writeStream);
            
            writeStream.on('error', (err) => {
              console.error('[Clipper API] Error writing upload stream:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Gagal mengunggah file video.' }));
            });
            
            writeStream.on('finish', () => {
              const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
              const fileName = `${safeTitle}_${Date.now()}.mp4`;
              const outputPath = path.join(outputDir, fileName);
              
              console.log(`[Clipper API] Memotong video lokal: ${tempUploadPath} [Detik: ${start} s.d. ${end}]`);
              
              // Spawning ffmpeg to cut the uploaded video segment
              const duration = end - start;
              
              // Trial 1: Stream Copy
              const copyArgs = [
                '-y',
                '-ss', start.toString(),
                '-i', tempUploadPath,
                '-t', duration.toString(),
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                outputPath
              ];

              console.log(`[Clipper API] Memotong video terunggah (Percobaan 1: Stream Copy)`);
              runFfmpeg(copyArgs, true);

              function runFfmpeg(ffmpegArgs, isFirstAttempt) {
                let ffmpegProcess;
                try {
                  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
                } catch (e) {
                  console.error('[Clipper API] Gagal spawn ffmpeg untuk upload:', e.message);
                  fs.unlink(tempUploadPath, () => {});
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Gagal menjalankan FFmpeg: ' + e.message }));
                  return;
                }

                let logOutput = '';
                ffmpegProcess.stdout.on('data', (data) => {
                  logOutput += data.toString();
                });
                ffmpegProcess.stderr.on('data', (data) => {
                  logOutput += data.toString();
                });

                ffmpegProcess.on('error', (err) => {
                  console.error('[Clipper API] Error FFmpeg pada upload:', err.message);
                  if (isFirstAttempt) {
                    fallbackToTranscode();
                  } else {
                    fs.unlink(tempUploadPath, () => {});
                    if (!res.headersSent) {
                      res.writeHead(500, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Terjadi error pada FFmpeg process: ' + err.message }));
                    }
                  }
                });

                ffmpegProcess.on('close', (code) => {
                  if (code === 0 && fs.existsSync(outputPath)) {
                    console.log(`[Clipper API] Video terunggah berhasil dipotong: ${outputPath}`);
                    // Delete temp upload file immediately
                    fs.unlink(tempUploadPath, (unlinkErr) => {
                      if (unlinkErr) console.warn('[Clipper API] Gagal menghapus file temp upload:', unlinkErr);
                    });
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                      success: true,
                      fileName: fileName,
                      downloadUrl: `/api/download-clip-file?file=${fileName}`
                    }));
                  } else {
                    if (isFirstAttempt) {
                      console.warn(`[Clipper API] Stream Copy gagal (kode keluar: ${code}). Melakukan fallback ke Transcoding...`);
                      fallbackToTranscode();
                    } else {
                      console.error(`[Clipper API] FFmpeg keluar dengan kode ${code}. Log:\n${logOutput}`);
                      fs.unlink(tempUploadPath, () => {});
                      res.writeHead(500, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        success: false,
                        error: `Gagal memotong video lokal. ffmpeg exit code: ${code}`,
                        log: logOutput
                      }));
                    }
                  }
                });
              }

              function fallbackToTranscode() {
                const transcodeArgs = [
                  '-y',
                  '-ss', start.toString(),
                  '-i', tempUploadPath,
                  '-t', duration.toString(),
                  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Prevent h264 odd-dimension crashes
                  '-c:v', 'libx264',
                  '-preset', 'superfast',
                  '-crf', '22',
                  '-pix_fmt', 'yuv420p',
                  '-c:a', 'aac',
                  '-map', '0:v:0',
                  '-map', '0:a?',
                  outputPath
                ];
                console.log(`[Clipper API] Memotong video terunggah (Percobaan 2: Transcoding)`);
                runFfmpeg(transcodeArgs, false);
              }
            });
          } catch (err) {
            console.error('[Clipper API] Terjadi kesalahan saat memotong video lokal:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API endpoint to stream the file download and delete it afterwards
      server.middlewares.use('/api/download-clip-file', (req, res, next) => {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const fileParam = urlObj.searchParams.get('file');

        if (fileParam) {
          const safeFile = path.basename(fileParam);
          const filePath = path.join(path.resolve('clips'), safeFile);

          if (fs.existsSync(filePath)) {
            res.writeHead(200, {
              'Content-Type': 'video/mp4',
              'Content-Disposition': `attachment; filename="${safeFile}"`
            });
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            
            // Delete file after client finishes downloading
            stream.on('end', () => {
              fs.unlink(filePath, (err) => {
                if (err) console.error('[Clipper API] Gagal menghapus file temporer:', err);
                else console.log('[Clipper API] Berhasil membersihkan file temporer klip:', safeFile);
              });
            });
            return;
          }
        }
        next();
      });
    }
  };
}
