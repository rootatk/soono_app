import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, Form, 
  InputGroup, Alert, Modal 
} from 'react-bootstrap';
import produtosService from '../../services/produtos';
import { formatarMoeda } from '../../utils/formatarMoeda';

const ProdutoList = () => {
  const navigate = useNavigate();
  
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome');
  
  // View mode persistente - mantém preferência até recarregar página
  const [viewMode, setViewMode] = useState(() => {
    return sessionStorage.getItem('produtos-view-mode') || 'grid';
  });

  // Função para alterar view mode e salvar preferência
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    sessionStorage.setItem('produtos-view-mode', newMode);
  };
  
  // Modal de confirmação
  const [showModal, setShowModal] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  const categorias = [
    'Pulseiras', 'Chaveiros', 'Bolsas', 
    'Outros'
  ];

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [produtos, busca, categoriaFiltro, ordenacao]);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const data = await produtosService.listar();
      setProdutos(data);
    } catch (err) {
      setError('Erro ao carregar produtos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...produtos];

    // Filtro por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca) ||
        produto.descricao?.toLowerCase().includes(termoBusca)
      );
    }

    // Filtro por categoria
    if (categoriaFiltro) {
      resultado = resultado.filter(produto => 
        produto.categoria === categoriaFiltro
      );
    }

    // Ordenação
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'categoria':
          return (a.categoria || '').localeCompare(b.categoria || '');
        case 'preco_asc':
          return a.precoVenda - b.precoVenda;
        case 'preco_desc':
          return b.precoVenda - a.precoVenda;
        case 'custo_asc':
          return a.custoTotal - b.custoTotal;
        case 'custo_desc':
          return b.custoTotal - a.custoTotal;
        default:
          return 0;
      }
    });

    setProdutosFiltrados(resultado);
  };

  const handleExcluir = (produto) => {
    setProdutoParaExcluir(produto);
    setShowModal(true);
  };

  const confirmarExclusao = async () => {
    try {
      await produtosService.excluir(produtoParaExcluir.id);
      setSuccess(`Produto "${produtoParaExcluir.nome}" excluído com sucesso!`);
      carregarProdutos();
    } catch (err) {
      setError('Erro ao excluir produto: ' + err.message);
    } finally {
      setShowModal(false);
      setProdutoParaExcluir(null);
    }
  };

  const calcularMargemLucro = (produto) => {
    if (!produto.precoVenda || produto.precoVenda === 0) return 0;
    return ((produto.precoVenda - produto.custoTotal) / produto.precoVenda * 100);
  };

  const getVariantePreco = (margem) => {
    if (margem < 10) return 'danger';
    if (margem < 20) return 'warning';
    if (margem < 30) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Container>
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
                Produtos
              </li>
            </ol>
          </nav>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-soono-brown mb-0">
                <i className="fas fa-box-open me-2"></i>
                Gestão de Produtos
              </h2>
              <p className="text-muted mb-0">
                {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} 
                {busca || categoriaFiltro ? ' (filtrado)' : ''}
                {produtos.length > 0 && produtosFiltrados.length !== produtos.length && (
                  <span> de {produtos.length} total</span>
                )}
              </p>
            </div>
            <div className="d-flex align-items-center">
              <div className="btn-group me-3" role="group">
                <button 
                  type="button" 
                  className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button 
                  type="button" 
                  className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
              <Button 
                variant="primary" 
                className="btn-soono-primary"
                onClick={() => navigate('/produtos/novo')}
              >
                <i className="fas fa-plus me-2"></i>
                Novo Produto
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Filtros */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Buscar produtos..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                  >
                    <option value="nome">Nome A-Z</option>
                    <option value="categoria">Categoria</option>
                    <option value="preco_asc">Menor Preço</option>
                    <option value="preco_desc">Maior Preço</option>
                    <option value="custo_asc">Menor Custo</option>
                    <option value="custo_desc">Maior Custo</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setBusca('');
                      setCategoriaFiltro('');
                      setOrdenacao('nome');
                    }}
                  >
                    Limpar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista de Produtos */}
          {produtosFiltrados.length === 0 ? (
            <Card className="text-center">
              <Card.Body className="py-5">
                <h5 className="text-muted">
                  {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado com os filtros aplicados'}
                </h5>
                {produtos.length === 0 && (
                  <Button 
                    variant="primary" 
                    className="btn-soono-primary mt-3"
                    onClick={() => navigate('/produtos/novo')}
                  >
                    Cadastrar Primeiro Produto
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <>
              {viewMode === 'grid' && (
                <Row>
                  {produtosFiltrados.map(produto => {
                    const margem = calcularMargemLucro(produto);
                    return (
                      <Col key={produto.id} md={6} lg={4} className="mb-4">
                        <Card className="h-100 card-soono">
                          <div className="card-img-container position-relative" style={{ height: '220px', overflow: 'hidden' }}>
                            {produto.imagemUrl ? (
                              <Card.Img 
                                variant="top" 
                                src={`http://localhost:3001${produto.imagemUrl}`} 
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  backgroundColor: '#f8f9fa',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                onClick={() => navigate(`/produtos/${produto.id}`)}
                              />
                            ) : (
                              <div 
                                className="d-flex align-items-center justify-content-center bg-light h-100"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/produtos/${produto.id}`)}
                              >
                                <i className="fas fa-box-open fa-3x text-muted"></i>
                              </div>
                            )}
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <h5 className="card-title fw-bold">{produto.nome}</h5>
                            {produto.categoria && (
                              <Badge bg="secondary" className="small mb-2">
                                {produto.categoria}
                              </Badge>
                            )}
                            <div className="d-flex justify-content-between">
                              <span>Custo:</span>
                              <span>{formatarMoeda(produto.custoTotal || 0)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <strong>Preço:</strong>
                              <strong className="text-success">{formatarMoeda(produto.precoVenda || 0)}</strong>
                            </div>
                            <div className="d-flex gap-2 mt-auto pt-3">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="flex-fill"
                                onClick={() => navigate(`/produtos/${produto.id}`)}
                                title="Ver detalhes"
                              >
                                <i className="fas fa-eye me-1"></i> Ver
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="flex-fill"
                                onClick={() => navigate(`/produtos/${produto.id}/editar`)}
                                title="Editar"
                              >
                                <i className="fas fa-edit me-1"></i> Editar
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="flex-fill"
                                onClick={() => handleExcluir(produto)}
                                title="Excluir"
                              >
                                <i className="fas fa-trash me-1"></i> Excluir
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
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
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th className="text-end">Custo</th>
                          <th className="text-end">Preço</th>
                          <th className="text-center">Margem</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtosFiltrados.map(produto => {
                          const margem = calcularMargemLucro(produto);
                          return (
                            <tr key={produto.id}>
                              <td>
                                <div className="image-thumbnail-container" style={{ width: '50px', height: '50px', position: 'relative' }}>
                                  {produto.imagemUrl ? (
                                    <img 
                                      src={`http://localhost:3001${produto.imagemUrl}`} 
                                      alt={produto.nome} 
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'contain', 
                                        borderRadius: '8px',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease'
                                      }}
                                      title={`Ver imagem de ${produto.nome}`}
                                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                      onClick={() => navigate(`/produtos/${produto.id}`)}
                                    />
                                  ) : (
                                    <div 
                                      className="d-flex align-items-center justify-content-center bg-light" 
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef'
                                      }}
                                    >
                                      <i className="fas fa-box-open text-muted"></i>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td><strong>{produto.nome}</strong></td>
                              <td>{produto.categoria}</td>
                              <td className="text-end">{formatarMoeda(produto.custoTotal)}</td>
                              <td className="text-end text-success">{formatarMoeda(produto.precoVenda)}</td>
                              <td className="text-center">
                                <Badge bg={getVariantePreco(margem)}>{margem.toFixed(1)}%</Badge>
                              </td>
                              <td className="text-end">
                                <div className="btn-group">
                                  <Button variant="outline-primary" size="sm" onClick={() => navigate(`/produtos/${produto.id}`)} title="Ver detalhes"><i className="fas fa-eye"></i></Button>
                                  <Button variant="outline-warning" size="sm" onClick={() => navigate(`/produtos/${produto.id}/editar`)} title="Editar"><i className="fas fa-edit"></i></Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => handleExcluir(produto)} title="Excluir"><i className="fas fa-trash"></i></Button>
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

          {/* Resumo */}
          {produtosFiltrados.length > 0 && (
            <Card className="mt-4 bg-light">
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center">
                    <h5 className="text-primary mb-0">{produtosFiltrados.length}</h5>
                    <small className="text-muted">Produtos</small>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5 className="text-success mb-0">
                      {formatarMoeda(produtosFiltrados.reduce((total, p) => total + (p.precoVenda || 0), 0))}
                    </h5>
                    <small className="text-muted">Valor Total</small>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5 className="text-info mb-0">
                      {formatarMoeda(produtosFiltrados.reduce((total, p) => total + (p.custoTotal || 0), 0))}
                    </h5>
                    <small className="text-muted">Custo Total</small>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5 className="text-warning mb-0">
                      {(produtosFiltrados.reduce((total, p) => {
                        const margem = calcularMargemLucro(p);
                        return total + margem;
                      }, 0) / produtosFiltrados.length).toFixed(1)}%
                    </h5>
                    <small className="text-muted">Margem Média</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal de Confirmação */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir o produto "{produtoParaExcluir?.nome}"?
          <br />
          <small className="text-muted">Esta ação não pode ser desfeita.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarExclusao}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProdutoList;