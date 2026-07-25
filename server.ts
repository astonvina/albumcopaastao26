import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dbInstance } from './src/db/db';
import { uploadToSupabaseStorage, isSupabaseServerConfigured } from './src/lib/supabaseServer';


const app = express();
const PORT = 3000;

// Ensure storage bucket directories exist
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
const STORAGE_BUCKETS = [
  'logos',
  'stickers/vermelho',
  'stickers/azul',
  'stickers/branco',
  'stickers/preto',
  'stickers/legends',
  'players',
  'teams',
  'backgrounds',
  'albums'
];

STORAGE_BUCKETS.forEach(bucket => {
  const bucketDir = path.join(UPLOADS_DIR, bucket);
  if (!fs.existsSync(bucketDir)) {
    fs.mkdirSync(bucketDir, { recursive: true });
  }
});


// Middlewares
app.use(express.json({ limit: '10mb' }));

// Static route to serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// --- API ENDPOINTS ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global Ranking Data
app.get('/api/ranking', (req, res) => {
  try {
    const rankingData = dbInstance.getRankingData();
    res.json({
      success: true,
      ...rankingData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao carregar dados do ranking: ' + err.message });
  }
});

// Public Player Profile Modal
app.get('/api/ranking/player/:id', (req, res) => {
  try {
    const playerId = req.params.id;
    const profile = dbInstance.getPublicPlayerProfile(playerId);
    if (profile) {
      res.json({
        success: true,
        profile
      });
    } else {
      res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro ao carregar perfil público: ' + err.message });
  }
});

// Authentication (Admin Login)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
  }

  const admin = dbInstance.validateAdmin(username, password);
  if (admin) {
    res.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } else {
    res.status(401).json({ success: false, error: 'Usuário ou senha inválidos.' });
  }
});

// Authentication (Player Login)
app.post('/api/player/login', (req, res) => {
  const { code, password } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Código de acesso é obrigatório.' });
  }

  const result = dbInstance.validatePlayerLogin(code, password);
  if (result.status === 'SUCCESS' && result.player) {
    const profile = dbInstance.getProfileForPlayer(result.player);
    res.json({
      success: true,
      player: result.player,
      profile
    });
  } else if (result.status === 'NEEDS_PASSWORD_SETUP' && result.player) {
    res.json({
      success: false,
      needsPasswordSetup: true,
      player: result.player,
      message: 'Primeiro acesso detectado. Crie sua senha de acesso.'
    });
  } else {
    res.status(401).json({ success: false, error: result.error || 'Código ou senha incorretos.' });
  }
});

// Create Player Password (First Access)
app.post('/api/player/create-password', (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      return res.status(400).json({ success: false, error: 'Código e nova senha são obrigatórios.' });
    }

    const result = dbInstance.setupPlayerPassword(code, password);
    if (result.success && result.player) {
      const profile = dbInstance.getProfileForPlayer(result.player);
      res.json({
        success: true,
        player: result.player,
        profile
      });
    } else {
      res.status(400).json({ success: false, error: result.error || 'Não foi possível cadastrar a senha.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Player Profile
app.get('/api/user/profile', (req, res) => {
  try {
    const playerId = req.query.playerId as string;
    if (playerId) {
      const player = dbInstance.getPlayerById(playerId);
      if (player) {
        const profile = dbInstance.getProfileForPlayer(player);
        return res.json({ success: true, profile, player });
      }
    }
    res.json({ success: true, profile: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/player/profile/:id', (req, res) => {
  try {
    const { id } = req.params;
    const player = dbInstance.getPlayerById(id);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
    const profile = dbInstance.getProfileForPlayer(player);
    res.json({ success: true, profile, player });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Player Pack Opening
app.post('/api/player/open-pack', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'ID do jogador é obrigatório.' });
    }

    const result = dbInstance.openPlayerPack(playerId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias for opening pack
app.post('/api/pack/open', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'ID do jogador é obrigatório.' });
    }

    const result = dbInstance.openPlayerPack(playerId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Player Recycling (5 duplicates -> 1 free pack)
app.post('/api/player/recycle', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'ID do jogador é obrigatório.' });
    }

    const result = dbInstance.recyclePlayerCards(playerId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/recycle/claim', (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ success: false, error: 'ID do jogador é obrigatório para realizar a troca.' });
    }

    const result = dbInstance.recyclePlayerCards(playerId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ADMIN PLAYER MANAGEMENT ---

// List Players
app.get('/api/admin/players', (req, res) => {
  try {
    const players = dbInstance.getPlayers();
    res.json({ success: true, players });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Player with Details
app.get('/api/admin/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const player = dbInstance.getPlayerById(id);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
    const profile = dbInstance.getProfileForPlayer(player);
    res.json({ success: true, player, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Player
app.post('/api/admin/players', (req, res) => {
  try {
    const { fullName, nickname, accessCode, team, photoUrl, purchasedPacks, freePacks } = req.body;
    if (!fullName || !nickname || !team) {
      return res.status(400).json({ success: false, error: 'Nome completo, apelido e time são obrigatórios.' });
    }

    const result = dbInstance.addPlayer({
      fullName,
      nickname,
      accessCode: accessCode || nickname,
      team,
      photoUrl,
      purchasedPacks: purchasedPacks !== undefined ? parseInt(purchasedPacks, 10) : undefined,
      freePacks: freePacks !== undefined ? parseInt(freePacks, 10) : undefined
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Player
app.put('/api/admin/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = dbInstance.updatePlayer(id, req.body);
    if (updated) {
      res.json({ success: true, player: updated });
    } else {
      res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Player
app.delete('/api/admin/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = dbInstance.deletePlayer(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset Player Password
app.post('/api/admin/players/:id/reset-password', (req, res) => {
  try {
    const { id } = req.params;
    const result = dbInstance.resetPlayerPassword(id);
    if (result.success) {
      res.json({ success: true, message: 'Senha do jogador foi resetada.' });
    } else {
      res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Adjust Player Pack Credits
app.post('/api/admin/players/:id/credits', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, reason, adminUsername } = req.body;
    const qty = parseInt(amount, 10);

    if (isNaN(qty) || !type || !reason) {
      return res.status(400).json({ success: false, error: 'Quantidade, tipo (purchased/free) e motivo são obrigatórios.' });
    }

    const result = dbInstance.adjustPlayerCredits(id, qty, type, reason, adminUsername || 'Admin');
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Championships
app.get('/api/admin/championships', (req, res) => {
  try {
    const championships = dbInstance.getChampionships();
    res.json({ success: true, championships });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/championships', (req, res) => {
  try {
    const { name, year } = req.body;
    if (!name || !year) {
      return res.status(400).json({ success: false, error: 'Nome e ano são obrigatórios.' });
    }
    const champ = dbInstance.addChampionship({ name, year: parseInt(year, 10) });
    res.json({ success: true, championship: champ });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard Statistics
app.get('/api/admin/stats', (req, res) => {
  try {
    const stats = dbInstance.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset System / Album
app.post('/api/admin/reset', (req, res) => {
  try {
    dbInstance.resetSystem();
    res.json({ success: true, message: 'O álbum de figurinhas e as estatísticas foram resetados com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stickers CRUD
app.get('/api/stickers', (req, res) => {
  try {
    const stickers = dbInstance.getStickers();
    res.json({ success: true, stickers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/stickers', (req, res) => {
  try {
    const { id, number, name, team, image, color, rarity, description } = req.body;
    if (!number || !name || !team || !rarity) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes.' });
    }

    const sticker = dbInstance.addSticker({
      id,
      number,
      name,
      team,
      image: image || '',
      color: color || '#FFFFFF',
      rarity,
      description: description || ''
    });

    res.json({ success: true, sticker });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/stickers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = dbInstance.updateSticker(id, req.body);
    if (updated) {
      res.json({ success: true, sticker: updated });
    } else {
      res.status(404).json({ success: false, error: 'Figurinha não encontrada.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/stickers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = dbInstance.deleteSticker(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Figurinha não encontrada.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to sanitize filenames
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_');
}

// Unified Storage Upload Endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { base64Image, bucket = 'stickers', customName, oldUrl } = req.body;
    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem foi fornecida.' });
    }

    // Match base64 header
    const matches = base64Image.match(/^data:image\/([A-Za-z0-9\-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato da imagem inválido. Utilize PNG, JPG, JPEG ou WEBP.' });
    }

    const extRaw = matches[1].toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
    if (!allowedExts.includes(extRaw)) {
      return res.status(400).json({ success: false, error: `Formato de imagem não suportado: .${extRaw}. Use PNG, JPG, JPEG ou WEBP.` });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    
    // Check max size: 10MB
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'A imagem excede o tamanho máximo permitido de 10 MB.' });
    }

    const extension = extRaw === 'jpeg' ? 'jpg' : extRaw;

    // Delete old URL if provided
    if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('/uploads/')) {
      dbInstance.deleteStorageFile(oldUrl);
    }

    // Sanitize target bucket subfolder
    const safeBucket = bucket.replace(/[^a-zA-Z0-9_\-\/]/g, '');
    const targetDir = path.join(UPLOADS_DIR, safeBucket);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Build unique filename
    const namePrefix = customName ? slugify(customName) : 'file';
    const timestamp = Date.now();
    const randomHash = Math.random().toString(36).substring(2, 6);
    const fileName = `${namePrefix}_${timestamp}_${randomHash}.${extension}`;

    // Try Supabase Storage first if configured
    if (isSupabaseServerConfigured) {
      const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      const supabaseUrl = await uploadToSupabaseStorage(safeBucket, fileName, fileBuffer, mimeType);
      if (supabaseUrl) {
        return res.json({
          success: true,
          url: supabaseUrl,
          fileName,
          bucket: safeBucket,
          size: fileBuffer.length
        });
      }
    }

    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    const publicUrl = `/uploads/${safeBucket}/${fileName}`;
    res.json({
      success: true,
      url: publicUrl,
      fileName,
      bucket: safeBucket,
      size: fileBuffer.length
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erro no servidor durante upload: ' + err.message });
  }
});

// Delete Storage File
app.post('/api/upload/delete', (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL da imagem é obrigatória.' });
    }
    const success = dbInstance.deleteStorageFile(url);
    res.json({ success, message: success ? 'Imagem excluída do Storage.' : 'Arquivo não encontrado ou já removido.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backward compatibility for sticker upload
app.post('/api/stickers/upload', (req, res) => {
  try {
    const { base64Image, fileName, team, oldUrl } = req.body;
    if (!base64Image) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
    }

    const matches = base64Image.match(/^data:image\/([A-Za-z0-9\-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Formato de base64 inválido.' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Tamanho excede 10MB.' });
    }

    if (oldUrl) {
      dbInstance.deleteStorageFile(oldUrl);
    }

    const extRaw = matches[1].toLowerCase();
    const extension = extRaw === 'jpeg' ? 'jpg' : extRaw;

    const teamSlug = team ? slugify(team.replace('Time ', '')) : 'geral';
    const safeBucket = `stickers/${teamSlug}`;
    const targetDir = path.join(UPLOADS_DIR, safeBucket);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const prefix = fileName ? slugify(fileName) : 'sticker';
    const cleanFileName = `${prefix}_${Date.now()}.${extension}`;
    const filePath = path.join(targetDir, cleanFileName);

    fs.writeFileSync(filePath, fileBuffer);

    const url = `/uploads/${safeBucket}/${cleanFileName}`;
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Probabilities Endpoints
app.get('/api/probability', (req, res) => {
  try {
    const settings = dbInstance.getProbabilitySettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/probability', (req, res) => {
  try {
    const { normalProbability, legendProbability } = req.body;
    const normal = parseFloat(normalProbability);
    const legend = parseFloat(legendProbability);

    if (isNaN(normal) || isNaN(legend) || normal + legend !== 100) {
      return res.status(400).json({ success: false, error: 'A soma das probabilidades deve ser exatamente 100%.' });
    }

    const settings = dbInstance.updateProbabilitySettings(normal, legend);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// System Settings Endpoints
app.get('/api/system/settings', (req, res) => {
  try {
    const settings = dbInstance.getSystemSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/system/settings', (req, res) => {
  try {
    const settings = dbInstance.updateSystemSettings(req.body);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Bulk Stickers Endpoint
app.post('/api/stickers/bulk', (req, res) => {
  try {
    const { stickers } = req.body;
    if (!Array.isArray(stickers) || stickers.length === 0) {
      return res.status(400).json({ success: false, error: 'Array de figurinhas é obrigatório.' });
    }
    const created = dbInstance.addStickersBulk(stickers);
    res.json({ success: true, created, count: created.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Championships API
app.get('/api/championships', (req, res) => {
  try {
    const championships = dbInstance.getChampionships();
    res.json({ success: true, championships });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/championships', (req, res) => {
  try {
    const newChamp = dbInstance.addChampionship(req.body);
    res.json({ success: true, championship: newChamp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/championships/:id', (req, res) => {
  try {
    const updated = dbInstance.updateChampionship(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Campeonato não encontrado.' });
    }
    res.json({ success: true, championship: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/championships/:id/close', (req, res) => {
  try {
    const closed = dbInstance.closeChampionship(req.params.id);
    res.json({ success: true, championship: closed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/championships/:id/duplicate', (req, res) => {
  try {
    const dup = dbInstance.duplicateChampionship(req.params.id);
    res.json({ success: true, championship: dup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/championships/:id/archive', (req, res) => {
  try {
    const archived = dbInstance.archiveChampionship(req.params.id);
    res.json({ success: true, championship: archived });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/championships/:id/activate', (req, res) => {
  try {
    const success = dbInstance.setActiveChampionship(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Prizes / Premiações API
app.get('/api/prizes', (req, res) => {
  try {
    const prizes = dbInstance.getPrizes();
    res.json({ success: true, prizes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/prizes', (req, res) => {
  try {
    const newPrize = dbInstance.addPrize(req.body);
    res.json({ success: true, prize: newPrize });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/prizes/:id', (req, res) => {
  try {
    const updated = dbInstance.updatePrize(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Prêmio não encontrado.' });
    }
    res.json({ success: true, prize: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/prizes/:id', (req, res) => {
  try {
    const deleted = dbInstance.deletePrize(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// System Logs
app.get('/api/logs', (req, res) => {
  try {
    const logs = dbInstance.getSystemLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ranking/player/:id', (req, res) => {
  try {
    const profile = dbInstance.getPublicPlayerProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Jogador não encontrado.' });
    }
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize Vite server or static server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;

