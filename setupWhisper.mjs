import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import sevenBin from '7zip-bin';  // إضافة مكتبة 7zip-bin
import node7z from 'node-7z';  // استيراد مكتبة node-7z

const { extractFull } = node7z;  // استخدام الوظيفة من node-7z

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupWhisper = async () => {
  const platform = os.platform();
  let downloadUrl = '';
  let archiveName = '';
  let extractPath = '';

  if (platform === 'win32') {
    downloadUrl = 'https://github.com/Purfview/whisper-standalone-win/releases/download/Faster-Whisper-XXL/Faster-Whisper-XXL_r239.1_windows.7z';
    archiveName = 'Faster-Whisper-XXL_r239.1_windows.7z';
    extractPath = path.join(__dirname, 'bin', 'win');
  } else if (platform === 'linux') {
    downloadUrl = 'https://github.com/Purfview/whisper-standalone-win/releases/download/Faster-Whisper-XXL/Faster-Whisper-XXL_r192.3.1_linux.7z';
    archiveName = 'Faster-Whisper-XXL_r192.3.1_linux.7z';
    extractPath = path.join(__dirname, 'bin', 'linux');
  } else {
    console.error('Unsupported platform');
    return;
  }

  const filePath = path.join(__dirname, archiveName);
  const binPath = path.join(__dirname, 'bin');
  const folderExists = await fs.pathExists(binPath);

  if (!folderExists) {
    console.log('The "bin" directory does not exist. Creating it now...');
    await fs.mkdirp(binPath);
    console.log('The "bin" directory has been created.');
  } else {
    console.log('The "bin" directory already exists.');
  }

  const extractedFolder = path.join(extractPath, 'Faster-Whisper-XXL');
  const archiveExists = await fs.pathExists(filePath);

  if (await fs.pathExists(extractedFolder)) {
    console.log('Folder already extracted, skipping download and extraction.');
    return;
  }

  if (!archiveExists) {
    console.log('Downloading file...');
    try {
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        console.log('Download finished.');
        if (await fs.pathExists(filePath)) {
          console.log('File downloaded successfully.');
          try {
            console.log('Extracting archive...');
            const pathTo7zip = sevenBin.path7za;  // المسار إلى 7z من 7zip-bin
            await extractFull(filePath, extractPath, {
              $bin: pathTo7zip  // تمرير المسار إلى 7z
            });

            if (await fs.pathExists(extractedFolder)) {
              const renamedFolder = path.join(extractPath, platform === 'win32' ? 'win' : 'linux');
              await fs.rename(extractedFolder, renamedFolder);
              console.log('Folder renamed to: ', renamedFolder);
            } else {
              console.error('Extraction failed or folder not found.');
            }
          } catch (error) {
            console.error('Error extracting archive:', error);
          }
        } else {
          console.error('File download failed.');
        }
      });

      writer.on('error', (err) => {
        console.error('Download error:', err);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  } else {
    console.log('Archive file already exists in root, skipping download.');
    try {
      console.log('Extracting existing archive...');
      const pathTo7zip = sevenBin.path7za;  // المسار إلى 7z من 7zip-bin
      await extractFull(filePath, extractPath, {
        $bin: pathTo7zip  // تمرير المسار إلى 7z
      });

      if (await fs.pathExists(extractedFolder)) {
        const renamedFolder = path.join(extractPath, platform === 'win32' ? 'win' : 'linux');
        await fs.rename(extractedFolder, renamedFolder);
        console.log('Folder renamed to: ', renamedFolder);
      } else {
        console.error('Extraction failed or folder not found.');
      }
    } catch (error) {
      console.error('Error extracting existing archive:', error);
    }
  }
};

setupWhisper();