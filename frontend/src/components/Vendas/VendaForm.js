import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Table, 
  Alert, Modal, Badge, InputGroup, Spinner
} from 'react-bootstrap';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import produtosService from '../../services/produtos';
import vendasService from '../../services/vendas';
import { formatarMoeda } from '../../utils/formatarMoeda';

const VendaForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Para detectar modo de edição
  
  // Detectar se está editando
  const isEditing = !!id;
  
  // Estados principais
  const [produtos, setProdutos] = useState([]);
  const [itensVenda, setItensVenda] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dados da venda
  const [cliente, setCliente] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Modal de adicionar produto
  const [showModalProduto, setShowModalProduto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [margemSimulada, setMargemSimulada] = useState('');
  
  // Simulação em tempo real
  const [simulacao, setSimulacao] = useState(null);
  const [totaisVenda, setTotaisVenda] = useState(null);

  useEffect(() => {
    carregarProdutos();
    
    // Verificar se há produto pré-selecionado vindo do simulador
    const produtoPreSelecionado = location.state?.produtoPreSelecionado;
    if (produtoPreSelecionado) {
      // Aguardar produtos carregarem, então adicionar o pré-selecionado
      setTimeout(() => {
        adicionarProdutoPreSelecionado(produtoPreSelecionado);
      }, 500);
    }
  }, []);

  const adicionarProdutoPreSelecionado = (produtoData) => {
    const produto = produtos.find(p => p.id == produtoData.produto_id);
    if (!produto) return;
    
    const novoItem = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      quantidade: produtoData.quantidade || 1,
      margem_simulada: produtoData.margem_simulada || null,
      // Anexar o produto completo para ter acesso aos dados como margemLucro
      produto: produto,
      preco_original: parseFloat(produto.precoVenda),
      preco_simulado: produto.precoVenda // Será recalculado na simulação
    };
    
    setItensVenda([novoItem]);
  };

  // Simular preços sempre que os itens mudarem
  useEffect(() => {
    if (itensVenda.length > 0) {
      simularPrecos(); // Apenas atualizar totais, não os itens
    } else {
      setTotaisVenda(null);
    }
  }, [itensVenda]);

  // Carregar dados da venda em modo de edição
  useEffect(() => {
    if (isEditing && id && produtos.length > 0) {
      carregarVendaParaEdicao();
    }
  }, [isEditing, id, produtos]);

  const carregarVendaParaEdicao = async () => {
    try {
      setLoading(true);
      const vendaData = await vendasService.buscarPorId(id);
      
      // Só permite editar vendas em rascunho
      if (vendaData.status !== 'rascunho') {
        setError('Só é possível editar vendas em rascunho');
        return;
      }
      
      // Carregar dados da venda
      setCliente(vendaData.cliente || '');
      setObservacoes(vendaData.observacoes || '');
      
      // Converter itens da venda para o formato do formulário
      console.log('Debug - produtos disponíveis:', produtos.length);
      const itensConvertidos = vendaData.itens?.map(item => {
        // Tentar encontrar o produto completo na lista de produtos carregados
        const produtoCompleto = produtos.find(p => p.id === item.produto_id);
        console.log(`Debug - Produto ${item.produto_id}:`, produtoCompleto ? 'encontrado' : 'não encontrado');
        if (produtoCompleto) {
          console.log('Debug - margemLucro:', produtoCompleto.margemLucro);
        }
        
        return {
          produto_id: item.produto_id,
          produto_nome: item.produto?.nome || item.produto_nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          margem_simulada: item.margem_simulada || null,
          // Usar o produto completo se disponível, senão usar os dados da venda
          produto: produtoCompleto || item.produto || {
            id: item.produto_id,
            nome: item.produto?.nome || item.produto_nome || 'Produto não encontrado',
            custoTotal: item.custo_total,
            precoVenda: item.preco_unitario_original,
            margemLucro: 0 // Fallback se não conseguir encontrar o produto
          },
          // Preservar dados originais da venda
          preco_original: item.preco_unitario_original,
          preco_simulado: item.preco_unitario_final,
          valor_total: item.valor_total,
          margem_real: item.margem_simulada
        };
      }) || [];
      
      setItensVenda(itensConvertidos);
      
      // Para modo de edição, usar os totais salvos da venda ao invés de simular
      // Isso preserva os valores originais mesmo se os produtos foram alterados/removidos
      const totaisSalvos = {
        subtotal: parseFloat(vendaData.subtotal) || 0,
        descontoCombo: {
          quantidadeParaDesconto: parseInt(vendaData.quantidade_produtos) || 0,
          percentualDesconto: parseFloat(vendaData.desconto_percentual) || 0,
          aplicaDesconto: (parseFloat(vendaData.desconto_percentual) || 0) > 0,
          valorDesconto: parseFloat(vendaData.desconto_valor) || 0
        },
        total: parseFloat(vendaData.total) || 0,
        custoTotal: vendaData.itens?.reduce((acc, item) => acc + (parseFloat(item.custo_total) || 0), 0) || 0,
        lucroTotal: parseFloat(vendaData.lucro_total) || 0,
        margemRealTotal: vendaData.total > 0 ? ((parseFloat(vendaData.lucro_total) || 0) / parseFloat(vendaData.total)) * 100 : 0
      };
      
      setTotaisVenda(totaisSalvos);
    } catch (err) {
      setError('Erro ao carregar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await produtosService.listar();
      setProdutos(response.produtos || response);
    } catch (err) {
      setError('Erro ao carregar produtos: ' + err.message);
    }
  };

  const simularPrecos = async () => {
    if (itensVenda.length === 0) return;
    
    try {
      const response = await vendasService.simularPrecos(itensVenda);
      
      // Atualizar apenas os totais - não os itens para evitar loop infinito
      setTotaisVenda(response.totais);
    } catch (err) {
      console.error('Erro na simulação:', err);
    }
  };

  // Função separada para atualizar itens com simulação (usada apenas no carregamento inicial)
  const simularPrecosComItens = async () => {
    if (itensVenda.length === 0) return;
    
    try {
      const response = await vendasService.simularPrecos(itensVenda);
      
      // Atualizar os totais
      setTotaisVenda(response.totais);
      
      // Atualizar os itens com os dados simulados
      const itensAtualizados = itensVenda.map((itemAtual, index) => {
        const itemSimulado = response.itens[index];
        if (itemSimulado) {
          return {
            ...itemAtual,
            preco_original: itemSimulado.preco_original,
            preco_simulado: itemSimulado.preco_simulado,
            valor_total: itemSimulado.valor_total,
            margem_real: itemSimulado.margem_real
          };
        }
        return itemAtual;
      });
      
      setItensVenda(itensAtualizados);
    } catch (err) {
      console.error('Erro na simulação:', err);
    }
  };

  // Função para simular com itens específicos (para carregamento de edição)
  const simularPrecosComItensEspecificos = async (itens) => {
    if (!itens || itens.length === 0) return;
    
    try {
      const response = await vendasService.simularPrecos(itens);
      
      // Atualizar os totais
      setTotaisVenda(response.totais);
      
      // Atualizar os itens com os dados simulados
      const itensAtualizados = itens.map((itemAtual, index) => {
        const itemSimulado = response.itens[index];
        if (itemSimulado) {
          return {
            ...itemAtual,
            preco_original: itemSimulado.preco_original,
            preco_simulado: itemSimulado.preco_simulado,
            valor_total: itemSimulado.valor_total,
            margem_real: itemSimulado.margem_real
          };
        }
        return itemAtual;
      });
      
      setItensVenda(itensAtualizados);
    } catch (err) {
      console.error('Erro na simulação específica:', err);
    }
  };

  const abrirModalProduto = (produto = null) => {
    setProdutoSelecionado(produto);
    setQuantidade(1);
    setMargemSimulada('');
    setSimulacao(null);
    setShowModalProduto(true);
  };

  const simularPrecoItem = async () => {
    if (!produtoSelecionado || !quantidade) return;
    
    try {
      const itensSimular = [{
        produto_id: produtoSelecionado.id,
        quantidade: quantidade,
        margem_simulada: margemSimulada || null
      }];
      
      const response = await vendasService.simularPrecos(itensSimular);
      setSimulacao(response.itens[0]);
    } catch (err) {
      setError('Erro na simulação: ' + err.message);
    }
  };

  const adicionarItem = () => {
    if (!produtoSelecionado || !quantidade) return;
    
    const novoItem = {
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      quantidade: parseInt(quantidade),
      margem_simulada: margemSimulada ? parseFloat(margemSimulada) : null,
      // Anexar o produto completo para ter acesso aos dados como margemLucro
      produto: produtoSelecionado,
      // Dados temporários para exibição (serão recalculados no backend)
      preco_original: parseFloat(produtoSelecionado.precoVenda),
      preco_simulado: simulacao ? simulacao.preco_simulado : produtoSelecionado.precoVenda
    };
    
    setItensVenda(prev => [...prev, novoItem]);
    setShowModalProduto(false);
  };

  const removerItem = (index) => {
    setItensVenda(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e, finalizar = false) => {
    e.preventDefault();
    
    if (itensVenda.length === 0) {
      setError('Adicione pelo menos um item à venda');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const dadosVenda = {
        itens: itensVenda,
        cliente: cliente.trim() || null,
        observacoes: observacoes.trim() || null
      };
      
      let vendaResultado;
      
      if (isEditing) {
        vendaResultado = await vendasService.atualizar(id, dadosVenda);
        if (finalizar) {
          await vendasService.finalizar(id);
          setSuccess('Venda atualizada e finalizada com sucesso!');
        } else {
          setSuccess('Venda atualizada com sucesso!');
        }
      } else {
        vendaResultado = await vendasService.criar(dadosVenda);
        if (finalizar) {
          await vendasService.finalizar(vendaResultado.id);
          setSuccess('Venda criada e finalizada com sucesso!');
        } else {
          setSuccess('Venda salva como rascunho!');
        }
      }
      
      setTimeout(() => {
        navigate('/vendas');
      }, 2000);
      
    } catch (err) {
      setError('Erro ao salvar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderComboInfo = () => {
    if (!totaisVenda || !totaisVenda.descontoCombo.aplicaDesconto) return null;
    
    return (
      <Alert variant="success">
        <i className="fas fa-gift me-2"></i>
        <strong>Desconto Combo Aplicado!</strong>
        <br />
        {totaisVenda.descontoCombo.quantidadeParaDesconto} produtos = {totaisVenda.descontoCombo.percentualDesconto}% de desconto
        <br />
        Economia: {formatarMoeda(totaisVenda.descontoCombo.valorDesconto)}
      </Alert>
    );
  };

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
              <li className="breadcrumb-item">
                <span 
                  className="text-decoration-underline" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/vendas')}
                >
                  Vendas
                </span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {isEditing ? 'Editar Venda' : 'Nova Venda'}
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
                {isEditing ? 'Editar Venda' : 'Nova Venda'}
              </h2>
              <p className="text-muted mb-0">
                Simulação de preços e descontos em tempo real
              </p>
            </div>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/vendas')}
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
      
      {success && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success">
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      <Form onSubmit={(e) => handleSubmit(e, false)}>
        <Row className="mb-5">
          {/* Coluna Principal - Itens */}
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Itens da Venda</h5>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => abrirModalProduto()}
                >
                  <i className="fas fa-plus me-2"></i>
                  Adicionar Produto
                </Button>
              </Card.Header>
              <Card.Body>
                {itensVenda.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Nenhum item adicionado</h5>
                    <p className="text-muted">
                      Clique em "Adicionar Produto" para começar
                    </p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Preço Unit.</th>
                        <th>Margem</th>
                        <th>Subtotal</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensVenda.map((item, index) => (
                        <tr key={index}>
                          <td>{item.produto_nome}</td>
                          <td>{item.quantidade}</td>
                          <td>
                            <div>
                              {item.preco_simulado && item.preco_simulado !== item.preco_original ? (
                                <>
                                  <small className="text-muted text-decoration-line-through">
                                    {formatarMoeda(item.preco_original)}
                                  </small>
                                  <br />
                                  <strong className="text-primary">
                                    {formatarMoeda(item.preco_simulado)}
                                  </strong>
                                </>
                              ) : (
                                formatarMoeda(item.preco_original || item.preco_simulado || 0)
                              )}
                            </div>
                          </td>
                          <td>
                            {item.margem_real ? (
                              <Badge bg="primary">{item.margem_real.toFixed(1)}%</Badge>
                            ) : item.margem_simulada ? (
                              <Badge bg="primary">{item.margem_simulada}%</Badge>
                            ) : (
                              <Badge bg="secondary">{(item.produto?.margemLucro || 0).toFixed(1)}%</Badge>
                            )}
                          </td>
                          <td>
                            <strong>
                              {formatarMoeda(item.valor_total || (item.preco_simulado || item.preco_original || 0) * item.quantidade)}
                            </strong>
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removerItem(index)}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar - Dados da Venda e Totais */}
          <Col lg={4}>
            {/* Dados do Cliente */}
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Dados da Venda</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Cliente (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Observações</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre a venda"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Info de Desconto Combo */}
            {renderComboInfo()}

            {/* Totais */}
            {totaisVenda && (
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">Resumo da Venda</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>{formatarMoeda(totaisVenda.subtotal)}</span>
                  </div>
                  
                  {totaisVenda.descontoCombo.aplicaDesconto && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Desconto ({totaisVenda.descontoCombo.percentualDesconto}%):</span>
                      <span>-{formatarMoeda(totaisVenda.descontoCombo.valorDesconto)}</span>
                    </div>
                  )}
                  
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total:</strong>
                    <strong className="text-primary fs-5">
                      {formatarMoeda(totaisVenda.total)}
                    </strong>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2 text-muted">
                    <small>Custo Total:</small>
                    <small>{formatarMoeda(totaisVenda.custoTotal)}</small>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <small>Lucro:</small>
                    <small>{formatarMoeda(totaisVenda.lucroTotal)}</small>
                  </div>
                  
                  <div className="d-flex justify-content-between text-success">
                    <small>Margem:</small>
                    <small>{totaisVenda.margemRealTotal.toFixed(1)}%</small>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Botões de Ação */}
            <div className="d-grid gap-2">
              <Button 
                variant="outline-primary" 
                type="submit"
                disabled={loading || itensVenda.length === 0}
              >
                {loading ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Salvando...</>
                ) : (
                  <><i className="fas fa-save me-2"></i>Salvar como Rascunho</>
                )}
              </Button>
              
              <Button 
                variant="success" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || itensVenda.length === 0}
              >
                <i className="fas fa-check me-2"></i>
                Finalizar Venda
              </Button>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Modal Adicionar Produto */}
      <Modal show={showModalProduto} onHide={() => setShowModalProduto(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Produto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Produto</Form.Label>
                <Form.Select
                  value={produtoSelecionado?.id || ''}
                  onChange={(e) => {
                    const produto = produtos.find(p => p.id == e.target.value);
                    setProdutoSelecionado(produto);
                    setSimulacao(null);
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(produto => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} - {formatarMoeda(produto.precoVenda)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Quantidade</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => {
                    setQuantidade(e.target.value);
                    setSimulacao(null);
                  }}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Simular Margem (%)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    max="99"
                    value={margemSimulada}
                    onChange={(e) => {
                      setMargemSimulada(e.target.value);
                      setSimulacao(null);
                    }}
                    placeholder="Ex: 25.5"
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={simularPrecoItem}
                    disabled={!produtoSelecionado || !quantidade}
                  >
                    <i className="fas fa-calculator"></i>
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Deixe vazio para usar o preço original
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              {produtoSelecionado && (
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Informações do Produto</h6>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Nome:</strong> {produtoSelecionado.nome}</p>
                    <p><strong>Custo:</strong> {formatarMoeda(produtoSelecionado.custoTotal)}</p>
                    <p><strong>Preço Original:</strong> {formatarMoeda(produtoSelecionado.precoVenda)}</p>
                    <p><strong>Margem Original:</strong> <Badge bg="secondary">{(produtoSelecionado.margemLucro || 0).toFixed(1)}%</Badge></p>
                    
                    {simulacao && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <h6 className="text-primary">Simulação de Preço</h6>
                        <p className="mb-1">
                          <strong>Novo Preço:</strong> 
                          <span className="text-primary ms-2">
                            {formatarMoeda(simulacao.preco_simulado)}
                          </span>
                        </p>
                        <p className="mb-1">
                          <strong>Margem Real:</strong> 
                          <span className="text-success ms-2">
                            {simulacao.margem_real.toFixed(1)}%
                          </span>
                        </p>
                        <p className="mb-0">
                          <strong>Lucro/Un:</strong> 
                          <span className="text-success ms-2">
                            {formatarMoeda(simulacao.lucro_total / simulacao.quantidade)}
                          </span>
                        </p>
                        
                        {simulacao.erro && (
                          <Alert variant="danger" className="mt-2 mb-0">
                            {simulacao.erro}
                          </Alert>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalProduto(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={adicionarItem}
            disabled={!produtoSelecionado || !quantidade}
          >
            Adicionar Item
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendaForm;
