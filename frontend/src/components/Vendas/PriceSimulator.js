import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Table, 
  Alert, Badge, InputGroup 
} from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import produtosService from '../../services/produtos';
import vendasService from '../../services/vendas';
import { formatarMoeda } from '../../utils/formatarMoeda';

const PriceSimulator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados do produto
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados da simulação
  const [margens, setMargens] = useState([]);
  const [novaMargemInput, setNovaMargemInput] = useState('');
  const [simulacoes, setSimulacoes] = useState([]);

  useEffect(() => {
    const produtoId = location.state?.produtoId;
    const produtoNome = location.state?.produtoNome;
    
    if (produtoId) {
      carregarProduto(produtoId);
      // Margens pré-definidas para simulação rápida
      setMargens([10, 15, 20, 25, 30, 35, 40, 45, 50]);
    } else {
      setError('Produto não especificado');
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    if (produto && margens.length > 0) {
      simularTodasMargens();
    }
  }, [produto, margens]);

  const carregarProduto = async (id) => {
    try {
      setLoading(true);
      const data = await produtosService.buscarPorId(id);
      setProduto(data);
    } catch (err) {
      setError('Erro ao carregar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simularTodasMargens = async () => {
    if (!produto) return;
    
    try {
      const itensSimular = margens.map(margem => ({
        produto_id: produto.id,
        quantidade: 1,
        margem_simulada: margem,
        eh_brinde: false
      }));
      
      const response = await vendasService.simularPrecos(itensSimular);
      setSimulacoes(response.itens);
    } catch (err) {
      setError('Erro na simulação: ' + err.message);
    }
  };

  const adicionarMargemCustomizada = () => {
    const novaMargemNum = parseFloat(novaMargemInput);
    
    if (isNaN(novaMargemNum) || novaMargemNum < 0 || novaMargemNum >= 100) {
      setError('Margem deve ser um número entre 0 e 99');
      return;
    }
    
    if (margens.includes(novaMargemNum)) {
      setError('Esta margem já está sendo simulada');
      return;
    }
    
    setMargens(prev => [...prev, novaMargemNum].sort((a, b) => a - b));
    setNovaMargemInput('');
    setError('');
  };

  const removerMargem = (margem) => {
    setMargens(prev => prev.filter(m => m !== margem));
  };

  const getVariacaoColor = (precoOriginal, precoSimulado) => {
    if (precoSimulado > precoOriginal) return 'success';
    if (precoSimulado < precoOriginal) return 'danger';
    return 'secondary';
  };

  const calcularVariacaoPercentual = (precoOriginal, precoSimulado) => {
    if (precoOriginal === 0) return 0;
    return ((precoSimulado - precoOriginal) / precoOriginal) * 100;
  };

  const margemAtualProduto = produto && produto.precoVenda > 0 && produto.custoTotal > 0 
    ? ((produto.precoVenda - produto.custoTotal) / produto.precoVenda) * 100 
    : 0;

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Simulador de Preços</h2>
              {produto && (
                <p className="text-muted mb-0">
                  Produto: <strong>{produto.nome}</strong>
                </p>
              )}
            </div>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Voltar
            </Button>
          </div>
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

      {produto && (
        <>
          {/* Informações do Produto */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Informações do Produto</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <strong>Custo Total:</strong>
                      <br />
                      <span className="text-danger fs-5">
                        {formatarMoeda(produto.custoTotal)}
                      </span>
                    </Col>
                    <Col md={3}>
                      <strong>Preço Atual:</strong>
                      <br />
                      <span className="text-primary fs-5">
                        {formatarMoeda(produto.precoVenda)}
                      </span>
                    </Col>
                    <Col md={3}>
                      <strong>Margem Atual:</strong>
                      <br />
                      <Badge bg="info" className="fs-6">
                        {margemAtualProduto.toFixed(1)}%
                      </Badge>
                    </Col>
                    <Col md={3}>
                      <strong>Lucro Atual:</strong>
                      <br />
                      <span className="text-success fs-5">
                        {formatarMoeda(produto.precoVenda - produto.custoTotal)}
                      </span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Adicionar Margem Customizada */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Adicionar Margem Customizada</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          step="0.1"
                          min="0"
                          max="99"
                          value={novaMargemInput}
                          onChange={(e) => setNovaMargemInput(e.target.value)}
                          placeholder="Ex: 27.5"
                        />
                        <InputGroup.Text>%</InputGroup.Text>
                        <Button 
                          variant="primary" 
                          onClick={adicionarMargemCustomizada}
                        >
                          <i className="fas fa-plus me-2"></i>
                          Simular
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex flex-wrap gap-1">
                        {margens.map(margem => (
                          <Badge 
                            key={margem} 
                            bg="secondary" 
                            className="d-flex align-items-center"
                          >
                            {margem}%
                            <Button
                              variant="link"
                              size="sm"
                              className="text-white p-0 ms-1"
                              onClick={() => removerMargem(margem)}
                            >
                              <i className="fas fa-times" style={{ fontSize: '0.8em' }}></i>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabela de Simulações */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Resultados da Simulação</h5>
                </Card.Header>
                <Card.Body>
                  {simulacoes.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-calculator fa-3x text-muted mb-3"></i>
                      <p className="text-muted">Adicione margens para simular</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Margem</th>
                          <th>Preço Simulado</th>
                          <th>Variação</th>
                          <th>Lucro/Unidade</th>
                          <th>Margem Real</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulacoes.map((sim, index) => {
                          const variacao = calcularVariacaoPercentual(produto.precoVenda, sim.preco_simulado);
                          const ehAtual = Math.abs(sim.margem_simulada - margemAtualProduto) < 0.1;
                          
                          return (
                            <tr key={index} className={ehAtual ? 'table-active' : ''}>
                              <td>
                                <Badge bg={ehAtual ? 'success' : 'primary'}>
                                  {sim.margem_simulada}%
                                  {ehAtual && <span className="ms-1">(Atual)</span>}
                                </Badge>
                              </td>
                              <td>
                                <strong className="text-primary">
                                  {formatarMoeda(sim.preco_simulado)}
                                </strong>
                              </td>
                              <td>
                                <Badge bg={getVariacaoColor(produto.precoVenda, sim.preco_simulado)}>
                                  {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                                </Badge>
                              </td>
                              <td>
                                <span className="text-success">
                                  {formatarMoeda(sim.lucro_total)}
                                </span>
                              </td>
                              <td>
                                <span className="text-info">
                                  {sim.margem_real.toFixed(1)}%
                                </span>
                              </td>
                              <td>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => {
                                    navigate('/vendas/nova', {
                                      state: {
                                        produtoPreSelecionado: {
                                          produto_id: produto.id,
                                          quantidade: 1,
                                          margem_simulada: sim.margem_simulada
                                        }
                                      }
                                    });
                                  }}
                                >
                                  <i className="fas fa-shopping-cart me-1"></i>
                                  Vender
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Actions */}
          <Row className="mt-4">
            <Col className="text-center">
              <Button 
                variant="success" 
                size="lg" 
                onClick={() => navigate('/vendas/nova', {
                  state: {
                    produtoPreSelecionado: {
                      produto_id: produto.id,
                      quantidade: 1
                    }
                  }
                })}
                className="me-3"
              >
                <i className="fas fa-shopping-cart me-2"></i>
                Criar Venda com Este Produto
              </Button>
              
              <Button 
                variant="outline-primary" 
                size="lg"
                onClick={() => navigate(`/produtos/${produto.id}`)}
              >
                <i className="fas fa-eye me-2"></i>
                Ver Detalhes do Produto
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default PriceSimulator;
