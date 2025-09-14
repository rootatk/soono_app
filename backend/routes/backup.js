/**
 * Backup API Routes
 * Sistema Sóonó - Macramê & Crochê
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { 
  createBackup, 
  listBackups, 
  verifyBackup,
  getBackupStats,
  manualCleanup
} = require('../utils/backupUtils');

/**
 * POST /api/backup/create - Create manual backup
 */
router.post('/create', async (req, res) => {
  try {
    const backupResult = createBackup();
    
    // Verify the backup
    const isValid = await verifyBackup(backupResult.path);
    
    // Get updated stats after creating backup
    const stats = getBackupStats();
    
    res.json({ 
      success: true, 
      message: backupResult.message,
      backupName: backupResult.name,
      existed: backupResult.existed,
      verified: isValid,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao criar backup via API:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar backup',
      error: error.message 
    });
  }
});

/**
 * GET /api/backup/list - List all backups
 */
router.get('/list', (req, res) => {
  try {
    const backups = listBackups();
    
    res.json({
      success: true,
      backups,
      total: backups.length
    });
    
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Erro ao listar backups',
      error: error.message 
    });
  }
});

/**
 * POST /api/backup/verify/:filename - Verify specific backup
 */
router.post('/verify/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../backups', filename);
    
    const isValid = await verifyBackup(backupPath);
    
    res.json({
      success: true,
      filename,
      valid: isValid,
      message: isValid ? 'Backup íntegro' : 'Backup corrompido'
    });
    
  } catch (error) {
    console.error('Erro ao verificar backup:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar backup',
      error: error.message
    });
  }
});

/**
 * GET /api/backup/status - Get backup system status
 */
router.get('/status', (req, res) => {
  try {
    const backups = listBackups();
    const lastBackup = backups.length > 0 ? backups[0] : null;
    
    let status = 'ok';
    let message = 'Sistema de backup operacional';
    
    if (!lastBackup) {
      status = 'warning';
      message = 'Nenhum backup encontrado';
    } else {
      const hoursSince = (Date.now() - lastBackup.created) / (1000 * 60 * 60);
      
      if (hoursSince > 48) {
        status = 'alert';
        message = `Último backup há ${Math.round(hoursSince)}h - backup recomendado`;
      } else if (hoursSince > 24) {
        status = 'warning';
        message = `Último backup há ${Math.round(hoursSince)}h`;
      }
    }
    
    res.json({
      success: true,
      status,
      message,
      lastBackup: lastBackup ? {
        name: lastBackup.name,
        age: lastBackup.age,
        size: `${(lastBackup.size / 1024).toFixed(1)} KB`
      } : null,
      totalBackups: backups.length
    });
    
  } catch (error) {
    console.error('Erro ao obter status do backup:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status',
      error: error.message
    });
  }
});

/**
 * GET /api/backup/stats - Get backup statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getBackupStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de backup:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/backup/cleanup - Manual cleanup
 */
router.post('/cleanup', (req, res) => {
  try {
    const stats = manualCleanup();
    res.json({
      success: true,
      message: 'Limpeza executada com sucesso',
      stats
    });
  } catch (error) {
    console.error('Erro na limpeza de backups:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na limpeza de backups',
      error: error.message
    });
  }
});

module.exports = router;