/**
 * Backup Utilities for Soono App
 * Sistema de backup para aplicações que não rodam 24/7
 */

const fs = require('fs');
const path = require('path');

// Configurações de limpeza automática
const MAX_BACKUPS = 30; // Manter até 30 backups
const MAX_SIZE_MB = 100; // Tamanho máximo da pasta de backups em MB
const MAX_AGE_DAYS = 60; // Deletar backups com mais de 60 dias

/**
 * Create a backup of the database
 */
const createBackup = () => {
  try {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const backupName = `soono-backup-${timestamp}.db`;
    const sourcePath = path.join(__dirname, '../database/soono.db');
    const backupDir = path.join(__dirname, '../backups');
    const backupPath = path.join(backupDir, backupName);
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Diretório de backup criado');
    }
    
    // Check if source database exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Database source file not found');
    }
    
  // Check if backup for today already exists
  if (fs.existsSync(backupPath)) {
    console.log(`✅ Backup de hoje já existe: ${backupName}`);
    
    // Return with a flag indicating existing backup
    return {
      path: backupPath,
      name: backupName,
      existed: true,
      message: 'Backup de hoje já existe'
    };
  }
  
  // Copy database file
  fs.copyFileSync(sourcePath, backupPath);
  
  const stats = fs.statSync(backupPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`✅ Backup criado: ${backupName} (${sizeKB} KB)`);
  
  // Auto-cleanup after creating backup
  cleanupOldBackups();
  
  // Log backup creation
  logBackupStatus(true, backupName, sizeKB);
  
  // Return with a flag indicating new backup
  return {
    path: backupPath,
    name: backupName,
    existed: false,
    message: 'Backup criado com sucesso',
    size: sizeKB
  };  } catch (error) {
    console.error('❌ Erro ao criar backup:', error.message);
    logBackupStatus(false, null, null, error.message);
    throw error;
  }
};

/**
 * Check backup age and create new one if needed
 */
const checkAndBackup = () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      console.log('📁 Primeira execução - criando backup inicial...');
      createBackup();
      return;
    }
    
    // Get all backup files
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('soono-backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.log('📁 Nenhum backup encontrado, criando primeiro backup...');
      createBackup();
      return;
    }
    
    const lastBackup = files[0];
    const hoursSinceLastBackup = (Date.now() - lastBackup.time) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup > 24) {
      console.log(`📅 Último backup há ${Math.round(hoursSinceLastBackup)} horas, criando novo...`);
      createBackup();
    } else {
      console.log(`✅ Backup recente encontrado: ${lastBackup.name} (${Math.round(hoursSinceLastBackup)}h atrás)`);
    }
    
    // Clean old backups (keep last 30)
    cleanupOldBackups();
    
  } catch (error) {
    console.error('❌ Erro ao verificar backups:', error.message);
  }
};

/**
 * Enhanced cleanup function with multiple criteria
 */
const cleanupOldBackups = () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupDir)) {
      return;
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('soono-backup-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          created: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.created - a.created); // Most recent first

    let deletedCount = 0;
    
    // 1. Delete by count (keep only MAX_BACKUPS)
    if (backupFiles.length > MAX_BACKUPS) {
      const filesToDelete = backupFiles.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        deletedCount++;
      });
      console.log(`🗑️ Removidos ${filesToDelete.length} backups antigos (limite: ${MAX_BACKUPS})`);
    }

    // 2. Delete by total size (if folder is too large)
    const remainingFiles = backupFiles.slice(0, MAX_BACKUPS);
    const totalSizeMB = remainingFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    
    if (totalSizeMB > MAX_SIZE_MB) {
      // Keep only the most recent files until under size limit
      let currentSize = 0;
      const filesToKeep = [];
      
      for (const file of remainingFiles) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (currentSize + fileSizeMB <= MAX_SIZE_MB) {
          filesToKeep.push(file);
          currentSize += fileSizeMB;
        } else {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️ Removidos backups por limite de tamanho (${MAX_SIZE_MB}MB)`);
      }
    }

    // 3. Delete very old backups (older than MAX_AGE_DAYS)
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - maxAgeMs;
    const currentFiles = backupFiles.filter(file => fs.existsSync(file.path));
    const veryOldFiles = currentFiles.filter(file => file.created.getTime() < cutoffDate);
    
    veryOldFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        deletedCount++;
      }
    });

    if (veryOldFiles.length > 0) {
      console.log(`🗑️ Removidos ${veryOldFiles.length} backups muito antigos (>${MAX_AGE_DAYS} dias)`);
    }

    if (deletedCount === 0) {
      console.log(`📁 Cleanup concluído - nenhum backup removido`);
    } else {
      console.log(`✅ Limpeza automática concluída - ${deletedCount} arquivo(s) removido(s)`);
    }

  } catch (error) {
    console.error(`❌ Erro no cleanup de backups: ${error.message}`);
  }
};

/**
 * List all available backups
 */
const listBackups = () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('soono-backup-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const age = Math.round((Date.now() - stats.mtime) / (1000 * 60 * 60));
        
        return {
          name: file,
          size: stats.size,
          created: stats.mtime,
          age: age < 24 ? `${age}h` : `${Math.round(age / 24)}d`,
          path: filePath
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return backups;
    
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error.message);
    return [];
  }
};

/**
 * Verify backup file integrity
 */
const verifyBackup = async (backupPath) => {
  try {
    const { Sequelize } = require('sequelize');
    
    const testDB = new Sequelize({
      dialect: 'sqlite',
      storage: backupPath,
      logging: false
    });
    
    await testDB.authenticate();
    await testDB.close();
    
    console.log(`✅ Backup verificado: ${path.basename(backupPath)}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Backup corrompido: ${path.basename(backupPath)}`);
    return false;
  }
};

/**
 * Log backup operations
 */
const logBackupStatus = (success, backupName, size, error = null) => {
  try {
    const logDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      success,
      backupName,
      size,
      error
    };
    
    const logPath = path.join(logDir, 'backup.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    
  } catch (error) {
    console.error('❌ Erro ao escrever log:', error.message);
  }
};

/**
 * Get comprehensive backup statistics
 */
const getBackupStats = () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupDir)) {
      return {
        count: 0,
        totalSize: 0,
        totalSizeMB: 0,
        oldestDate: null,
        newestDate: null,
        backups: []
      };
    }

    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('soono-backup-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          name: file,
          size: stats.size,
          created: stats.mtime,
          age: Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)),
          path: filePath
        };
      })
      .sort((a, b) => b.created - a.created);

    const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
    
    return {
      count: backupFiles.length,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      oldestDate: backupFiles.length > 0 ? backupFiles[backupFiles.length - 1].created : null,
      newestDate: backupFiles.length > 0 ? backupFiles[0].created : null,
      backups: backupFiles
    };
  } catch (error) {
    console.error(`❌ Erro ao obter estatísticas de backup: ${error.message}`);
    return { count: 0, totalSize: 0, totalSizeMB: 0, backups: [] };
  }
};

/**
 * Manual cleanup function for API
 */
const manualCleanup = () => {
  console.log('🧹 Executando limpeza manual de backups...');
  cleanupOldBackups();
  return getBackupStats();
};

/**
 * Graceful shutdown with backup
 */
const gracefulShutdown = async () => {
  console.log('\n🔄 Finalizando aplicação - criando backup...');
  
  try {
    const backupResult = createBackup();
    console.log(`✅ Backup de encerramento criado com sucesso`);
    
    // Brief verification
    const isValid = await verifyBackup(backupResult.path);
    if (isValid) {
      console.log('💾 Backup verificado - dados seguros!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar backup de encerramento:', error.message);
  }
  
  console.log('👋 Soono App finalizado. Até logo!');
  process.exit(0);
};

module.exports = {
  createBackup,
  checkAndBackup,
  cleanOldBackups: cleanupOldBackups,
  listBackups,
  verifyBackup,
  gracefulShutdown,
  getBackupStats,
  manualCleanup
};