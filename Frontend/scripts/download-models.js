const https = require('https');
const fs = require('fs');
const path = require('path');

// Direct download từ GitHub raw với đường dẫn đầy đủ
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/';

const models = [
  { path: 'tiny_face_detector_model-weights_manifest.json', url: BASE_URL + 'tiny_face_detector_model-weights_manifest.json' },
  { path: 'tiny_face_detector_model-shard1', url: BASE_URL + 'tiny_face_detector_model-shard1' },
  { path: 'face_landmark_68_model-weights_manifest.json', url: BASE_URL + 'face_landmark_68_model-weights_manifest.json' },
  { path: 'face_landmark_68_model-shard1', url: BASE_URL + 'face_landmark_68_model-shard1' },
  { path: 'face_recognition_model-weights_manifest.json', url: BASE_URL + 'face_recognition_model-weights_manifest.json' },
  { path: 'face_recognition_model-shard1', url: BASE_URL + 'face_recognition_model-shard1' },
  { path: 'face_recognition_model-shard2', url: BASE_URL + 'face_recognition_model-shard2' },
];

const MODELS_DIR = path.join(__dirname, '../public/models');

// Tạo folder nếu chưa có
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('📁 Created models directory');
}

console.log('📥 Downloading Face-API models...\n');

let completed = 0;
const total = models.length;

models.forEach((model) => {
  const url = model.url;
  const dest = path.join(MODELS_DIR, model.path);

  https.get(url, (response) => {
    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      completed++;
      console.log(`✅ [${completed}/${total}] Downloaded: ${model.path}`);
      
      if (completed === total) {
        console.log('\n🎉 All models downloaded successfully!');
      }
    });
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${model.path}:`, err.message);
  });
});
