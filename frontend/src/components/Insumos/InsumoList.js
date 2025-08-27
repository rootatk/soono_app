// src/components/Insumos/InsumoList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { insumoService } from '../../services/insumos';
import { formatarMoeda } from '../../utils/formatarMoeda';

const InsumoList = () => {
  const navigate = useNavigate();
  
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    nome: '',
    categoria: '',
    variacao: '',
    estoqueAbaixoMinimo: false
  });

  // Modal de confirmação para exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [insumoParaExcluir, setInsumoParaExcluir] = useState(null);

  const categorias = [
    'Linhas e Fios',
    'Miçangas', 
    'Fechos',
    'Pingentes',
    'Cordões',
    'Ferramentas',
    'Acessórios',
    'Outros'
  ];

  const variacoes = Array.from({ length: 26 }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  useEffect(() => {
    carregarInsumos();
  }, []);

  const carregarInsumos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await insumoService.listar();
      
      console.log('Resposta da API:', response); // Log para debug
      
      // Verificar diferentes formatos de resposta possíveis
      let dadosInsumos = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          dadosInsumos = response.data;
        } else if (response.data.insumos && Array.isArray(response.data.insumos)) {
          dadosInsumos = response.data.insumos;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dadosInsumos = response.data.data;
        } else {
          console.warn('Formato de resposta inesperado:', response.data);
        }
      } else if (Array.isArray(response)) {
        dadosInsumos = response;
      }
      
      setInsumos(dadosInsumos);
      console.log('Insumos carregados:', dadosInsumos);
      console.log('PRIMEIRO INSUMO DETALHADO:', dadosInsumos[0]);
      
    } catch (err) {
      console.error('Erro ao carregar insumos:', err);
      setError('Erro ao carregar lista de insumos');
      setInsumos([]); // Garantir que seja sempre um array
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filtrarInsumos = () => {
    // Garantir que insumos é sempre um array
    if (!Array.isArray(insumos)) {
      console.warn('insumos não é um array:', insumos);
      return [];
    }

    return insumos.filter(insumo => {
      const nomeMatch = !filtros.nome || 
        insumo.nome.toLowerCase().includes(filtros.nome.toLowerCase());
      
      const categoriaMatch = !filtros.categoria || 
        insumo.categoria === filtros.categoria;
      
      const variacaoMatch = !filtros.variacao || 
        insumo.variacao === filtros.variacao;

      const estoqueMatch = !filtros.estoqueAbaixoMinimo || 
        insumo.estoqueAtual <= insumo.estoqueMinimo;;

      return nomeMatch && categoriaMatch && variacaoMatch && estoqueMatch;
    });
  };

  const confirmarExclusao = (insumo) => {
    setInsumoParaExcluir(insumo);
    setShowDeleteModal(true);
  };

  const excluirInsumo = async () => {
    if (!insumoParaExcluir) return;

    try {
      setError('');
      await insumoService.excluir(insumoParaExcluir.id);
      
      // Remove da lista sem precisar recarregar
      setInsumos(prev => prev.filter(i => i.id !== insumoParaExcluir.id));
      
      setShowDeleteModal(false);
      setInsumoParaExcluir(null);
      
    } catch (err) {
      console.error('Erro ao excluir insumo:', err);
      setError('Erro ao excluir insumo');
      setShowDeleteModal(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      nome: '',
      categoria: '',
      variacao: '',
      estoqueAbaixoMinimo: false
    });
  };

  const getAlertaEstoque = (insumo) => {
     if (insumo.estoqueAtual === 0) {
      return { classe: 'danger', texto: 'SEM ESTOQUE', icone: 'fa-times-circle' };
    }
    if (insumo.estoqueAtual <= insumo.estoqueMinimo) {
      return { classe: 'warning', texto: 'ESTOQUE BAIXO', icone: 'fa-exclamation-triangle' };
    }
    return { classe: 'success', texto: 'OK', icone: 'fa-check-circle' };
  };

  const insumosFiltrados = filtrarInsumos();
  const totalInsumos = Array.isArray(insumos) ? insumos.length : 0;

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando insumos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <span 
              className="text-decoration-underline" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Dashboard
            </span>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Insumos
          </li>
        </ol>
      </nav>

      {/* Cabeçalho */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6">
          <h2 className="text-soono-brown">
            <i className="fas fa-cubes me-2"></i>
            Gestão de Insumos
          </h2>
          <p className="text-muted mb-0">
            {insumosFiltrados.length} insumo{insumosFiltrados.length !== 1 ? 's' : ''} 
            {filtros.nome || filtros.categoria || filtros.variacao || filtros.estoqueAbaixoMinimo ? ' (filtrado)' : ''}
            {totalInsumos > 0 && insumosFiltrados.length !== totalInsumos && (
              <span> de {totalInsumos} total</span>
            )}
          </p>
        </div>
        <div className="col-md-6 text-end">
          <button 
            className="btn btn-soono-primary"
            onClick={() => navigate('/insumos/novo')}
          >
            <i className="fas fa-plus me-2"></i>
            Novo Insumo
          </button>
        </div>
      </div>

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

      {/* Filtros */}
      <div className="card card-soono mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Nome */}
            <div className="col-md-4">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-control"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Buscar por nome..."
              />
            </div>

            {/* Categoria */}
            <div className="col-md-3">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                name="categoria"
                value={filtros.categoria}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Variação */}
            <div className="col-md-2">
              <label className="form-label">Variação</label>
              <select
                className="form-select"
                name="variacao"
                value={filtros.variacao}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                {variacoes.map(variacao => (
                  <option key={variacao} value={variacao}>
                    {variacao}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Estoque Baixo */}
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="estoqueAbaixoMinimo"
                  name="estoqueAbaixoMinimo"
                  checked={filtros.estoqueAbaixoMinimo}
                  onChange={handleFiltroChange}
                />
                <label className="form-check-label" htmlFor="estoqueAbaixoMinimo">
                  Apenas estoque baixo
                </label>
              </div>
            </div>
          </div>

          {/* Botão Limpar */}
          <div className="row mt-3">
            <div className="col-12">
              <button 
                className="btn btn-outline-secondary"
                onClick={limparFiltros}
              >
                <i className="fas fa-eraser me-2"></i>
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Lista de Insumos */}
      {!Array.isArray(insumos) ? (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Erro no formato dos dados. Verifique a conexão com o servidor.
          <div className="mt-2">
            <button className="btn btn-sm btn-outline-primary" onClick={carregarInsumos}>
              <i className="fas fa-sync me-1"></i>
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : insumosFiltrados.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">
            {totalInsumos === 0 ? 'Nenhum insumo cadastrado' : 'Nenhum insumo encontrado com os filtros aplicados'}
          </h5>
          {totalInsumos === 0 && (
            <button 
              className="btn btn-soono-primary mt-3"
              onClick={() => navigate('/insumos/novo')}
            >
              <i className="fas fa-plus me-2"></i>
              Cadastrar Primeiro Insumo
            </button>
          )}
        </div>
      ) : (
        <div className="row">
          {insumosFiltrados.map(insumo => {
            const alerta = getAlertaEstoque(insumo);
            const valorTotalEstoque = insumo.custoUnitario * insumo.estoqueAtual;

            return (
              <div key={insumo.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card card-soono h-100">
                  <div className="card-body d-flex flex-column">
                    {/* Cabeçalho do Card */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-1">
                          {insumo.nome}
                          {insumo.variacao && (
                            <span className="badge bg-secondary ms-2">
                              {insumo.variacao}
                            </span>
                          )}
                        </h5>
                        <p className="text-muted small mb-0">{insumo.categoria}</p>
                      </div>
                      
                      {/* Status do Estoque */}
                      <span className={`badge bg-${alerta.classe}`}>
                        <i className={`fas ${alerta.icone} me-1`}></i>
                        {alerta.texto}
                      </span>
                    </div>

                    {/* Informações */}
                    <div className="mb-3 flex-grow-1">
                      <div className="row g-2">
                        <div className="col-6">
                          <small className="text-muted">Custo Unitário:</small>
                          <div className="fw-bold">{formatarMoeda(insumo.custoUnitario)}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Em Estoque:</small>
                          <div className="fw-bold">
                            {insumo.estoqueAtual} {insumo.unidade}
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Estoque Mín.:</small>
                          <div>{insumo.estoqueMinimo} {insumo.unidade}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Valor Total:</small>
                          <div className="fw-bold text-soono-gold">
                            {formatarMoeda(valorTotalEstoque)}
                          </div>
                        </div>
                      </div>

                      {insumo.fornecedor && (
                        <div className="mt-2">
                          <small className="text-muted">Fornecedor:</small>
                          <div className="small">{insumo.fornecedor}</div>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="d-flex gap-2 mt-auto">
                      <button
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => navigate(`/insumos/${insumo.id}`)}
                        title="Ver detalhes"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-warning btn-sm flex-fill"
                        onClick={() => navigate(`/insumos/${insumo.id}/editar`)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm flex-fill"
                        onClick={() => confirmarExclusao(insumo)}
                        title="Excluir"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  Confirmar Exclusão
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Tem certeza que deseja excluir o insumo:</p>
                <p className="fw-bold text-danger">
                  "{insumoParaExcluir?.nome}"
                </p>
                <p className="text-muted small">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={excluirInsumo}
                >
                  <i className="fas fa-trash me-2"></i>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo Estatístico */}
      {insumosFiltrados.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card card-soono">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-chart-bar me-2"></i>
                  Resumo do Estoque
                </h6>
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="h4 text-soono-brown mb-0">
                      {insumosFiltrados.length}
                    </div>
                    <small className="text-muted">Total de Insumos</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-success mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual > i.estoqueMinimo).length}
                    </div>
                    <small className="text-muted">Estoque OK</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-warning mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual > 0 && i.estoqueAtual <= i.estoqueMinimo).length}
                    </div>
                    <small className="text-muted">Estoque Baixo</small>
                  </div>
                  <div className="col-md-3">
                    <div className="h4 text-danger mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual === 0).length}
                    </div>
                    <small className="text-muted">Sem Estoque</small>
                  </div>
                </div>
                <hr />
                <div className="text-center">
                  <div className="h5 text-soono-gold mb-0">
                    {formatarMoeda(
                      insumosFiltrados.reduce((total, insumo) => 
                        total + (insumo.custoUnitario * insumo.estoqueAtual), 0
                      )
                    )}
                  </div>
                  <small className="text-muted">Valor Total do Estoque</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsumoList;