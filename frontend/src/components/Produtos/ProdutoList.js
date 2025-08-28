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
  
  // Modal de confirmação
  const [showModal, setShowModal] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  const categorias = [
    'Colares', 'Pulseiras', 'Brincos', 'Anéis', 
    'Conjuntos', 'Personalizados', 'Outros'
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
      await produtosService.excluirProduto(produtoParaExcluir.id);
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
    if (!produto.custoTotal || produto.custoTotal === 0) return 0;
    return ((produto.precoVenda - produto.custoTotal) / produto.custoTotal * 100);
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
            <Button 
              variant="primary" 
              className="btn-soono-primary"
              onClick={() => navigate('/produtos/novo')}
            >
              <i className="fas fa-plus me-2"></i>
              Novo Produto
            </Button>
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
            <Row>
              {produtosFiltrados.map(produto => {
                const margem = calcularMargemLucro(produto);
                return (
                  <Col key={produto.id} md={6} lg={4} className="mb-4">
                    <Card className="h-100 card-soono">
                      <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">{produto.nome}</h6>
                            {produto.categoria && (
                              <Badge bg="secondary" className="small">
                                {produto.categoria}
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            bg={getVariantePreco(margem)} 
                            className="ms-2"
                          >
                            {margem.toFixed(1)}% lucro
                          </Badge>
                        </div>
                      </Card.Header>

                      <Card.Body className="d-flex flex-column">
                        {produto.descricao && (
                          <p className="text-muted small mb-3" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {produto.descricao}
                          </p>
                        )}

                        <div className="mb-3">
                          <div className="d-flex justify-content-between small text-muted">
                            <span>Custo Total:</span>
                            <span>{formatarMoeda(produto.custoTotal || 0)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <strong>Preço de Venda:</strong>
                            <strong className="text-success">
                              {formatarMoeda(produto.precoVenda || 0)}
                            </strong>
                          </div>
                        </div>

                        <div className="mb-3 small text-muted">
                          <div className="d-flex justify-content-between">
                            <span>Insumos:</span>
                            <span>{produto.insumos?.length || 0} itens</span>
                          </div>
                          {produto.maoDeObraHoras > 0 && (
                            <div className="d-flex justify-content-between">
                              <span>Mão de Obra:</span>
                              <span>{produto.maoDeObraHoras}h</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          <div className="d-grid gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/produtos/${produto.id}`)}
                            >
                              Ver Detalhes
                            </Button>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="flex-fill"
                                onClick={() => navigate(`/produtos/${produto.id}/editar`)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="flex-fill"
                                onClick={() => handleExcluir(produto)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
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