import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, Badge, 
  Form, InputGroup, Alert, Spinner, Pagination 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import vendasService from '../../services/vendas';
import { formatarMoeda } from '../../utils/formatarMoeda';

const VendaList = () => {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    carregarVendas();
  }, [paginaAtual, filtros]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginaAtual,
        limit: 10,
        ...filtros
      };
      
      const data = await vendasService.listar(params);
      setVendas(data.vendas);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch (err) {
      setError('Erro ao carregar vendas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginaAtual(1); // Reset para primeira página
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      dataInicio: '',
      dataFim: ''
    });
    setPaginaAtual(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'rascunho': 'secondary',
      'finalizada': 'success',
      'cancelada': 'danger'
    };
    
    const labels = {
      'rascunho': 'Rascunho',
      'finalizada': 'Finalizada', 
      'cancelada': 'Cancelada'
    };
    
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calcularQuantidadeItens = (itens) => {
    if (!itens || !Array.isArray(itens)) return 0;
    return itens.reduce((total, item) => total + item.quantidade, 0);
  };

  const renderPaginacao = () => {
    if (totalPaginas <= 1) return null;
    
    const items = [];
    for (let i = 1; i <= totalPaginas; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === paginaAtual}
          onClick={() => setPaginaAtual(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          <Pagination.Prev 
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(paginaAtual - 1)}
          />
          {items}
          <Pagination.Next 
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(paginaAtual + 1)}
          />
        </Pagination>
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Breadcrumb */}
      <Row>
        <Col>
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
                Vendas
              </li>
            </ol>
          </nav>
        </Col>
      </Row>

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-soono-brown mb-0">
                <i className="fas fa-shopping-cart me-2"></i>
                Vendas
              </h2>
              <p className="text-muted mb-0">
                {total} {total === 1 ? 'venda encontrada' : 'vendas encontradas'}
              </p>
            </div>
            <Button 
              variant="primary" 
              className="btn-soono-primary"
              onClick={() => navigate('/vendas/nova')}
            >
              <i className="fas fa-plus me-2"></i>
              Nova Venda
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filtros.status}
                      onChange={(e) => handleFiltroChange('status', e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cancelada">Cancelada</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Data Início</Form.Label>
                    <Form.Control
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Data Fim</Form.Label>
                    <Form.Control
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={limparFiltros}
                    className="w-100"
                  >
                    <i className="fas fa-times me-2"></i>
                    Limpar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Tabela de Vendas */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              {vendas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Nenhuma venda encontrada</h5>
                  <p className="text-muted">
                    Comece criando sua primeira venda!
                  </p>
                  <Button 
                    variant="primary" 
                    className="btn-soono-primary"
                    onClick={() => navigate('/vendas/nova')}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Nova Venda
                  </Button>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Itens</th>
                        <th>Subtotal</th>
                        <th>Desconto</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map(venda => (
                        <tr key={venda.id}>
                          <td>
                            <strong>{venda.codigo}</strong>
                          </td>
                          <td>
                            {new Date(venda.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            {venda.cliente || <span className="text-muted">Sem cliente</span>}
                          </td>
                          <td>
                            <Badge bg="info">
                              {calcularQuantidadeItens(venda.itens)} {calcularQuantidadeItens(venda.itens) === 1 ? 'item' : 'itens'}
                            </Badge>
                          </td>
                          <td>{formatarMoeda(venda.subtotal)}</td>
                          <td>
                            {venda.desconto_valor > 0 ? (
                              <span className="text-success">
                                -{formatarMoeda(venda.desconto_valor)} ({venda.desconto_percentual}%)
                              </span>
                            ) : (
                              <span className="text-muted">Sem desconto</span>
                            )}
                          </td>
                          <td>
                            <strong>{formatarMoeda(venda.total)}</strong>
                          </td>
                          <td>{getStatusBadge(venda.status)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/vendas/${venda.id}`)}
                              className="me-1"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            {venda.status === 'rascunho' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => navigate(`/vendas/${venda.id}/editar`)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {renderPaginacao()}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendaList;
