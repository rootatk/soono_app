// src/components/Insumos/InsumoList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
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
  const [viewMode, setViewMode] = useState('grid');

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
      const dadosInsumos = await insumoService.listar();
      setInsumos(dadosInsumos);
    } catch (err) {
      console.error('Erro ao carregar insumos:', err);
      setError('Erro ao carregar lista de insumos');
      setInsumos([]);
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
    <Container className="mt-4">
      <Row>
        <Col>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-soono-brown mb-0">
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
        <div className="d-flex align-items-center">
          <div className="btn-group me-3" role="group">
            <button 
              type="button" 
              className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button 
              type="button" 
              className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
          <Button 
            variant="primary" 
            className="btn-soono-primary"
            onClick={() => navigate('/insumos/novo')}
          >
            <i className="fas fa-plus me-2"></i>
            Novo Insumo
          </Button>
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
          <Row className="g-3">
            {/* Nome */}
            <Col md={4}>
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-control"
                name="nome"
                value={filtros.nome}
                onChange={handleFiltroChange}
                placeholder="Buscar por nome..."
              />
            </Col>

            {/* Categoria */}
            <Col md={3}>
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
            </Col>

            {/* Variação */}
            <Col md={2}>
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
            </Col>

            {/* Checkbox Estoque Baixo */}
            <Col md={3} className="d-flex align-items-end">
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
            </Col>
          </Row>

          {/* Botão Limpar */}
          <Row className="mt-3">
            <Col xs={12}>
              <button 
                className="btn btn-outline-secondary"
                onClick={limparFiltros}
              >
                <i className="fas fa-eraser me-2"></i>
                Limpar Filtros
              </button>
            </Col>
          </Row>
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
        <>
          {viewMode === 'grid' && (
            <Row>
              {insumosFiltrados.map(insumo => {
                const alerta = getAlertaEstoque(insumo);
                const valorTotalEstoque = insumo.custoUnitario * insumo.estoqueAtual;

                return (
                  <Col key={insumo.id} md={6} lg={4} className="mb-4">
                    <div className="card card-soono h-100">
                      {insumo.imagemUrl ? (
                        <img
                          src={`http://localhost:3001${insumo.imagemUrl}`}
                          alt={insumo.nome}
                          className="card-img-top"
                          style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => navigate(`/insumos/${insumo.id}`)}
                        />
                      ) : (
                        <div 
                          className="card-img-top d-flex align-items-center justify-content-center bg-light"
                          style={{ height: '150px', cursor: 'pointer' }}
                          onClick={() => navigate(`/insumos/${insumo.id}`)}
                        >
                          <i className="fas fa-image fa-2x text-muted"></i>
                        </div>
                      )}
                      <div className="card-body d-flex flex-column">
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
                          <span className={`badge bg-${alerta.classe}`}>
                            <i className={`fas ${alerta.icone} me-1`}></i>
                            {alerta.texto}
                          </span>
                        </div>
                        <div className="mb-3 flex-grow-1">
                          <Row className="g-2">
                            <Col xs={6}>
                              <small className="text-muted">Custo Unitário:</small>
                              <div className="fw-bold">{formatarMoeda(insumo.custoUnitario)}</div>
                            </Col>
                            <Col xs={6}>
                              <small className="text-muted">Em Estoque:</small>
                              <div className="fw-bold">{insumo.estoqueAtual} {insumo.unidade}</div>
                            </Col>
                          </Row>
                        </div>
                        <div className="d-flex gap-2 mt-auto">
                          <button
                            className="btn btn-outline-primary btn-sm flex-fill"
                            onClick={() => navigate(`/insumos/${insumo.id}`)}
                            title="Ver detalhes"
                          >
                            <i className="fas fa-eye me-1"></i> Ver
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm flex-fill"
                            onClick={() => navigate(`/insumos/${insumo.id}/editar`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit me-1"></i> Editar
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm flex-fill"
                            onClick={() => confirmarExclusao(insumo)}
                            title="Excluir"
                          >
                            <i className="fas fa-trash me-1"></i> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}

          {viewMode === 'list' && (
            <div className="card card-soono">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}></th>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th className="text-end">Custo Unit.</th>
                      <th className="text-center">Estoque</th>
                      <th className="text-center">Status</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosFiltrados.map(insumo => {
                      const alerta = getAlertaEstoque(insumo);
                      return (
                        <tr key={insumo.id}>
                          <td>
                            {insumo.imagemUrl ? (
                              <img src={`http://localhost:3001${insumo.imagemUrl}`} alt={insumo.nome} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center bg-light" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
                                <i className="fas fa-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{insumo.nome}</strong>
                            {insumo.variacao && <span className="badge bg-secondary ms-2">{insumo.variacao}</span>}
                          </td>
                          <td>{insumo.categoria}</td>
                          <td className="text-end">{formatarMoeda(insumo.custoUnitario)}</td>
                          <td className="text-center">{insumo.estoqueAtual} {insumo.unidade}</td>
                          <td className="text-center">
                            <span className={`badge bg-${alerta.classe}`}>
                              <i className={`fas ${alerta.icone} me-1`}></i>
                              {alerta.texto}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group">
                              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/insumos/${insumo.id}`)} title="Ver detalhes"><i className="fas fa-eye"></i></button>
                              <button className="btn btn-outline-warning btn-sm" onClick={() => navigate(`/insumos/${insumo.id}/editar`)} title="Editar"><i className="fas fa-edit"></i></button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => confirmarExclusao(insumo)} title="Excluir"><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
        <Row className="mt-4">
          <Col xs={12}>
            <div className="card card-soono">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-chart-bar me-2"></i>
                  Resumo do Estoque
                </h6>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="h4 text-soono-brown mb-0">
                      {insumosFiltrados.length}
                    </div>
                    <small className="text-muted">Total de Insumos</small>
                  </Col>
                  <Col md={3}>
                    <div className="h4 text-success mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual > i.estoqueMinimo).length}
                    </div>
                    <small className="text-muted">Estoque OK</small>
                  </Col>
                  <Col md={3}>
                    <div className="h4 text-warning mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual > 0 && i.estoqueAtual <= i.estoqueMinimo).length}
                    </div>
                    <small className="text-muted">Estoque Baixo</small>
                  </Col>
                  <Col md={3}>
                    <div className="h4 text-danger mb-0">
                      {insumosFiltrados.filter(i => i.estoqueAtual === 0).length}
                    </div>
                    <small className="text-muted">Sem Estoque</small>
                  </Col>
                </Row>
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
          </Col>
        </Row>
      )}
    </Col>
  </Row>
</Container>
  );
};

export default InsumoList;