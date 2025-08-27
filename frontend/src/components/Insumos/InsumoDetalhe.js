// src/components/Insumos/InsumoDetalhe.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { insumoService } from '../../services/insumos';
import { formatarMoeda } from '../../utils/formatarMoeda';

const InsumoDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [insumo, setInsumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal de movimentação de estoque
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState('entrada'); // 'entrada' ou 'saida'
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [processandoMovimentacao, setProcessandoMovimentacao] = useState(false);

  useEffect(() => {
    if (id) {
      carregarInsumo();
    }
  }, [id]);

  const carregarInsumo = async () => {
    try {
      setLoading(true);
      setError('');

      const insumoData = await insumoService.buscarPorId(id);

      if (insumoData) {
        setInsumo(insumoData);
      } else {
        setError('Insumo não encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar insumo:', err);
      setError('Erro ao carregar detalhes do insumo');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalMovimentacao = (tipo) => {
    setTipoMovimentacao(tipo);
    setQuantidade('');
    setObservacao('');
    setShowMovimentacaoModal(true);
  };

  const processarMovimentacao = async (e) => {
    e.preventDefault();

    if (!quantidade || parseFloat(quantidade) <= 0) {
      setError('Quantidade deve ser maior que zero');
      return;
    }

    if (tipoMovimentacao === 'saida' && parseFloat(quantidade) > insumo.estoqueAtual) {
      setError('Quantidade de saída não pode ser maior que o estoque atual');
      return;
    }

    try {
      setProcessandoMovimentacao(true);
      setError('');

      const dadosMovimentacao = {
        tipo: tipoMovimentacao,
        quantidade: parseFloat(quantidade),
        observacao: observacao.trim() || 
          `${tipoMovimentacao === 'entrada' ? 'Entrada' : 'Saída'} manual de estoque`
      };

      await insumoService.movimentarEstoque(id, dadosMovimentacao);
      
      setSuccess(
        `${tipoMovimentacao === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidade} ${insumo.unidade} realizada com sucesso!`
      );
      
      setShowMovimentacaoModal(false);
      
      // Recarregar dados do insumo
      await carregarInsumo();

    } catch (err) {
      console.error('Erro na movimentação:', err);
      setError(
        err.response?.data?.message || 
        'Erro ao processar movimentação de estoque'
      );
    } finally {
      setProcessandoMovimentacao(false);
    }
  };

  const getStatusEstoque = () => {
    if (!insumo) return { classe: 'secondary', texto: 'N/A', icone: 'fa-question' };

    if (insumo.estoqueAtual === 0) {
      return { classe: 'danger', texto: 'SEM ESTOQUE', icone: 'fa-times-circle' };
    }
    if (insumo.estoqueAtual <= insumo.estoqueMinimo) {
      return { classe: 'warning', texto: 'ESTOQUE BAIXO', icone: 'fa-exclamation-triangle' };
    }
    return { classe: 'success', texto: 'ESTOQUE OK', icone: 'fa-check-circle' };
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando detalhes do insumo...</p>
        </div>
      </div>
    );
  }

  if (error && !insumo) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/insumos')}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Voltar para Insumos
        </button>
      </div>
    );
  }

  if (!insumo) {
    return null;
  }

  const statusEstoque = getStatusEstoque();
  const valorTotalEstoque = insumo.custoUnitario * insumo.estoqueAtual;

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <span 
              className="text-decoration-underline" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </span>
          </li>
          <li className="breadcrumb-item">
            <span 
              className="text-decoration-underline" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/insumos')}
            >
              Insumos
            </span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {insumo.nome}
          </li>
        </ol>
      </nav>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6">
          <h2 className="text-soono-brown">
            {insumo.nome}
            {insumo.variacao && (
              <span className="badge bg-secondary ms-2">
                Variação {insumo.variacao}
              </span>
            )}
          </h2>
          <p className="text-muted mb-0">
            <i className="fas fa-tag me-1"></i>
            {insumo.categoria}
          </p>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group" role="group">
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate(`/insumos/${id}/editar`)}
            >
              <i className="fas fa-edit me-2"></i>
              Editar
            </button>
            <button 
              className="btn btn-success"
              onClick={() => abrirModalMovimentacao('entrada')}
            >
              <i className="fas fa-plus me-2"></i>
              Entrada
            </button>
            <button 
              className="btn btn-warning"
              onClick={() => abrirModalMovimentacao('saida')}
              disabled={insumo.estoqueAtual === 0}
            >
              <i className="fas fa-minus me-2"></i>
              Saída
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Informações Principais */}
        <div className="col-lg-8">
          <div className="card card-soono mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Informações do Insumo
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted">Nome:</label>
                  <div className="fw-bold">{insumo.nome}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Categoria:</label>
                  <div>{insumo.categoria}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Custo Unitário:</label>
                  <div className="h5 text-soono-gold mb-0">
                    {formatarMoeda(insumo.custoUnitario)} / {insumo.unidade}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Unidade de Medida:</label>
                  <div className="text-capitalize">{insumo.unidade}</div>
                </div>
                {insumo.fornecedor && (
                  <div className="col-md-6">
                    <label className="form-label text-muted">Fornecedor:</label>
                    <div>{insumo.fornecedor}</div>
                  </div>
                )}
                {insumo.variacao && (
                  <div className="col-md-6">
                    <label className="form-label text-muted">Variação:</label>
                    <div>
                      <span className="badge bg-secondary">{insumo.variacao}</span>
                    </div>
                  </div>
                )}
                {insumo.observacoes && (
                  <div className="col-12">
                    <label className="form-label text-muted">Observações:</label>
                    <div className="p-3 bg-light rounded">{insumo.observacoes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Estoque */}
        <div className="col-lg-4">
          <div className="card card-soono mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-boxes me-2"></i>
                Controle de Estoque
              </h5>
              <span className={`badge bg-${statusEstoque.classe}`}>
                <i className={`fas ${statusEstoque.icone} me-1`}></i>
                {statusEstoque.texto}
              </span>
            </div>
            <div className="card-body text-center">
              {/* Quantidade Atual */}
              <div className="mb-3">
                <div className="display-6 text-soono-brown">
                  {insumo.estoqueAtual}
                </div>
                <small className="text-muted">{insumo.unidade} em estoque</small>
              </div>

              {/* Estoque Mínimo */}
              <div className="row text-center mb-3">
                <div className="col-6">
                  <div className="h6 mb-0">{insumo.estoqueMinimo}</div>
                  <small className="text-muted">Mín. recomendado</small>
                </div>
                <div className="col-6">
                  <div className="h6 text-soono-gold mb-0">
                    {formatarMoeda(valorTotalEstoque)}
                  </div>
                  <small className="text-muted">Valor total</small>
                </div>
              </div>

              {/* Progress Bar do Estoque */}
              <div className="mb-3">
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className={`progress-bar bg-${statusEstoque.classe}`}
                    style={{ 
                      width: `${Math.min(100, Math.max(10, (insumo.estoqueAtual / (insumo.estoqueMinimo * 2)) * 100))}%` 
                    }}
                  ></div>
                </div>
                <small className="text-muted">
                  Nível de estoque relativo ao mínimo
                </small>
              </div>

              {/* Alertas de Estoque */}
              {insumo.estoqueAtual === 0 && (
                <div className="alert alert-danger small py-2">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Produto em falta!
                </div>
              )}
              {insumo.estoqueAtual > 0 && insumo.estoqueAtual <= insumo.estoqueMinimo && (
                <div className="alert alert-warning small py-2">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Estoque baixo, considere repor!
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="card card-soono">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Ações Rápidas
              </h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => abrirModalMovimentacao('entrada')}
                >
                  <i className="fas fa-plus me-2"></i>
                  Registrar Entrada
                </button>
                <button 
                  className="btn btn-warning btn-sm"
                  onClick={() => abrirModalMovimentacao('saida')}
                  disabled={insumo.estoqueAtual === 0}
                >
                  <i className="fas fa-minus me-2"></i>
                  Registrar Saída
                </button>
                <hr className="my-2" />
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate(`/insumos/${id}/editar`)}
                >
                  <i className="fas fa-edit me-2"></i>
                  Editar Insumo
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/insumos')}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Voltar à Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Movimentação de Estoque */}
      {showMovimentacaoModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`fas ${tipoMovimentacao === 'entrada' ? 'fa-plus text-success' : 'fa-minus text-warning'} me-2`}></i>
                  {tipoMovimentacao === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowMovimentacaoModal(false)}
                ></button>
              </div>
              <form onSubmit={processarMovimentacao}>
                <div className="modal-body">
                  {/* Informações do Insumo */}
                  <div className="alert alert-info">
                    <h6 className="mb-2">{insumo.nome}</h6>
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Estoque Atual:</small>
                        <div className="fw-bold">
                          {insumo.estoqueAtual} {insumo.unidade}
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Custo Unitário:</small>
                        <div className="fw-bold">{formatarMoeda(insumo.custoUnitario)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className="mb-3">
                    <label htmlFor="quantidade" className="form-label">
                      Quantidade para {tipoMovimentacao} *
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="quantidade"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="0"
                        step="0.01"
                        min="0.01"
                        max={tipoMovimentacao === 'saida' ? insumo.estoqueAtual : undefined}
                        required
                      />
                      <span className="input-group-text">{insumo.unidade}</span>
                    </div>
                    {tipoMovimentacao === 'saida' && quantidade && parseFloat(quantidade) > insumo.estoqueAtual && (
                      <div className="form-text text-danger">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Quantidade não pode ser maior que o estoque atual
                      </div>
                    )}
                  </div>

                  {/* Preview do Novo Estoque */}
                  {quantidade && parseFloat(quantidade) > 0 && (
                    <div className="alert alert-light">
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="text-muted">Atual</div>
                          <div className="fw-bold">{insumo.estoqueAtual}</div>
                        </div>
                        <div className="col-4">
                          <div className={`text-${tipoMovimentacao === 'entrada' ? 'success' : 'warning'}`}>
                            {tipoMovimentacao === 'entrada' ? '+' : '-'}{quantidade}
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-muted">Novo</div>
                          <div className="fw-bold">
                            {tipoMovimentacao === 'entrada' 
                              ? insumo.estoqueAtual + parseFloat(quantidade)
                              : insumo.estoqueAtual - parseFloat(quantidade)
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observação */}
                  <div className="mb-3">
                    <label htmlFor="observacao" className="form-label">
                      Observação
                    </label>
                    <textarea
                      className="form-control"
                      id="observacao"
                      rows="2"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder={`Descreva o motivo da ${tipoMovimentacao}...`}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowMovimentacaoModal(false)}
                    disabled={processandoMovimentacao}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-${tipoMovimentacao === 'entrada' ? 'success' : 'warning'}`}
                    disabled={processandoMovimentacao || !quantidade || parseFloat(quantidade) <= 0}
                  >
                    {processandoMovimentacao ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processando...
                      </>
                    ) : (
                      <>
                        <i className={`fas ${tipoMovimentacao === 'entrada' ? 'fa-plus' : 'fa-minus'} me-2`}></i>
                        Confirmar {tipoMovimentacao === 'entrada' ? 'Entrada' : 'Saída'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsumoDetalhe;