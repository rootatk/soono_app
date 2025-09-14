import React, { useState, useEffect } from 'react';

const BackupManager = () => {
  const [stats, setStats] = useState({
    count: 0,
    totalSizeMB: 0,
    backups: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Carregar estatísticas
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/backup/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de backup:', error);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Show different messages based on whether backup was created or already existed
        if (result.existed) {
          setMessage(`ℹ️ ${result.message}: ${result.backupName}`);
        } else {
          setMessage(`✅ ${result.message}: ${result.backupName}`);
        }
        
        if (result.stats) {
          setStats(result.stats);
        } else {
          await loadStats();
        }
      } else {
        setMessage(`❌ Erro ao criar backup: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setMessage(`❌ Erro ao criar backup: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/backup/cleanup', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${result.message}`);
        if (result.stats) {
          setStats(result.stats);
        } else {
          await loadStats();
        }
      } else {
        setMessage(`❌ ${result.message || 'Erro na limpeza'}`);
      }
    } catch (error) {
      setMessage(`❌ Erro na limpeza: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Fortaleza',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAgeColor = (age) => {
    if (age <= 7) return 'success';
    if (age <= 30) return 'warning';
    return 'danger';
  };

  const storageUsage = Math.min((stats.totalSizeMB / 100) * 100, 100);

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">💾 Gerenciador de Backup</h5>
                <div>
                  <button 
                    className="btn btn-outline-light btn-sm me-2"
                    onClick={runCleanup}
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳' : '🧹'} Limpar
                  </button>
                  <button 
                    className="btn btn-light"
                    onClick={createBackup}
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳ Criando...' : '🔄 Criar Backup'}
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.includes('❌') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
                  {message}
                  <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
              )}

              {/* Estatísticas */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h3 className="text-primary">{stats.count}</h3>
                      <small className="text-muted">Total de Backups</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h3 className="text-info">{stats.totalSizeMB} MB</h3>
                      <small className="text-muted">Espaço Utilizado</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <small className="text-muted">Uso do Storage (limite: 100MB)</small>
                      <div className="progress mt-2">
                        <div 
                          className={`progress-bar ${storageUsage > 80 ? 'bg-danger' : storageUsage > 60 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${storageUsage}%` }}
                        >
                          {Math.round(storageUsage)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Backups */}
              <h6>📂 Backups Disponíveis</h6>
              {stats.backups.length === 0 ? (
                <div className="alert alert-info">
                  <p className="mb-0">Nenhum backup encontrado</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Arquivo</th>
                        <th>Tamanho</th>
                        <th>Idade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.backups.map((backup, index) => (
                        <tr key={backup.filename || index}>
                          <td>{formatDate(backup.created)}</td>
                          <td>
                            <small className="font-monospace">{backup.filename || backup.name}</small>
                          </td>
                          <td>{formatFileSize(backup.size)}</td>
                          <td>
                            <span className={`badge bg-${getAgeColor(backup.age)}`}>
                              {backup.age === 0 ? 'Hoje' : `${backup.age} dias`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Informações */}
              <div className="alert alert-info mt-3">
                <small>
                  <strong>📋 Política de Limpeza Automática:</strong><br/>
                  • Mantém até 30 backups recentes<br/>
                  • Remove backups com mais de 60 dias<br/>
                  • Limita o total a 100MB<br/>
                  • Limpeza executada automaticamente após cada backup
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;