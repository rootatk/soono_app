import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, 
  Alert, Badge, Spinner, Modal
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import vendasService from '../../services/vendas';
import { formatarMoeda } from '../../utils/formatarMoeda';

const VendaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [venda, setVenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    carregarVenda();
  }, [id]);

  const carregarVenda = async () => {
    try {
      setLoading(true);
      const data = await vendasService.buscarPorId(id);
      setVenda(data);
    } catch (err) {
      setError('Erro ao carregar venda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenda = async () => {
    try {
      setDeleting(true);
      await vendasService.excluir(id);
      navigate('/vendas', {
        state: { message: 'Venda excluída com sucesso!' }
      });
    } catch (err) {
      setError('Erro ao excluir venda: ' + err.message);
      setDeleting(false);
    }
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

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const calcularMargemGeral = (lucroTotal, valorTotal) => {
    if (!valorTotal || valorTotal === 0) return 0;
    return ((parseFloat(lucroTotal) / parseFloat(valorTotal)) * 100);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
          <p className="mt-3">Carregando detalhes da venda...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Erro</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/vendas')}>
              Voltar para Vendas
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!venda) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Venda não encontrada</Alert.Heading>
          <p>A venda solicitada não foi encontrada.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate('/vendas')}>
              Voltar para Vendas
            </Button>
          </div>
        </Alert>
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
                Venda #{venda.id}
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
              <h2>
                <i className="fas fa-receipt me-2"></i>
                Detalhes da Venda #{venda.id}
              </h2>
              <p className="text-muted mb-0">
                {getStatusBadge(venda.status)}
                <span className="ms-3">
                  Criada em {formatarData(venda.createdAt)}
                </span>
              </p>
            </div>
            <div>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/vendas')}
                className="me-2"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Voltar
              </Button>
              
              {venda.status === 'rascunho' && (
                <>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(`/vendas/${id}/editar`)}
                    className="me-2"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Editar
                  </Button>
                </>
              )}
              
              {(venda.status === 'rascunho' || venda.status === 'finalizada' || venda.status === 'cancelada') && (
                <Button 
                  variant="danger" 
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i className="fas fa-trash me-2"></i>
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Informações da Venda */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Informações da Venda
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>ID:</strong> #{venda.id}</p>
                  <p><strong>Status:</strong> {getStatusBadge(venda.status)}</p>
                  <p><strong>Data de Criação:</strong> {formatarData(venda.createdAt)}</p>
                  {venda.updatedAt !== venda.createdAt && (
                    <p><strong>Última Atualização:</strong> {formatarData(venda.updatedAt)}</p>
                  )}
                </Col>
                <Col md={6}>
                  <p><strong>Quantidade de Produtos:</strong> {venda.quantidade_produtos || 0}</p>
                  <p><strong>Desconto Aplicado:</strong> {(venda.desconto_percentual || 0).toFixed(1)}%</p>
                  {venda.observacoes && (
                    <p><strong>Observações:</strong> {venda.observacoes}</p>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-calculator me-2"></i>
                Resumo Financeiro
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h6 className="text-muted">Subtotal (Sem Desconto)</h6>
                <h4 className="text-primary">
                  {formatarMoeda(parseFloat(venda.subtotal) || 0)}
                </h4>
                
                {(parseFloat(venda.desconto_valor) || 0) > 0 && (
                  <>
                    <h6 className="text-muted mt-3">Desconto ({(parseFloat(venda.desconto_percentual) || 0).toFixed(1)}%)</h6>
                    <h5 className="text-warning">
                      - {formatarMoeda(parseFloat(venda.desconto_valor) || 0)}
                    </h5>
                  </>
                )}
                
                <hr />
                <h6 className="text-muted">Total Final</h6>
                <h3 className="text-success">
                  {formatarMoeda(parseFloat(venda.total) || 0)}
                </h3>
                
                <hr />
                <h6 className="text-muted">Lucro Total</h6>
                <h4 className="text-info">
                  {formatarMoeda(parseFloat(venda.lucro_total) || 0)}
                </h4>
                {(parseFloat(venda.desconto_valor) || 0) > 0 && (
                  <small className="text-muted d-block mt-1">
                    (após desconto aplicado)
                  </small>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Itens da Venda */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Itens da Venda ({venda.itens?.length || 0}) - Detalhado
              </h5>
            </Card.Header>
            <Card.Body>
              {!venda.itens || venda.itens.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nenhum item encontrado nesta venda</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th className="text-warning">
                        <i className="fas fa-dollar-sign me-1"></i>
                        Custo
                      </th>
                      <th>Preço Original</th>
                      <th>Preço Final</th>
                      <th>Margem</th>
                      <th className="text-primary">
                        <i className="fas fa-calculator me-1"></i>
                        Subtotal
                      </th>
                      <th className="text-success">
                        <i className="fas fa-chart-line me-1"></i>
                        Lucro
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {venda.itens.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <strong>{item.produto?.nome || item.produto_nome || 'Produto não encontrado'}</strong>
                            {item.produto?.codigo && (
                              <small className="text-muted d-block">
                                Código: {item.produto.codigo}
                              </small>
                            )}
                            {!item.produto && item.produto_nome && (
                              <small className="text-warning d-block">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Produto removido do sistema
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">
                            {item.quantidade}x
                          </Badge>
                        </td>
                        <td>
                          {/* Mostrar custos com desconto progressivo */}
                          <div>
                            {parseFloat(item.custo_unitario_original || 0) !== parseFloat(item.custo_unitario_final || 0) ? (
                              <>
                                <div>
                                  <small className="text-muted text-decoration-line-through">
                                    {formatarMoeda(parseFloat(item.custo_unitario_original) || 0)}
                                  </small>
                                </div>
                                <div>
                                  <strong className="text-warning">
                                    {formatarMoeda(parseFloat(item.custo_unitario_final) || 0)}
                                  </strong>
                                  {parseFloat(item.desconto_custo_aplicado || 0) > 0 && (
                                    <small className="text-success d-block">
                                      <i className="fas fa-arrow-down me-1"></i>
                                      -{formatarMoeda(parseFloat(item.desconto_custo_aplicado))}
                                    </small>
                                  )}
                                </div>
                              </>
                            ) : (
                              <strong className="text-warning">
                                {formatarMoeda(parseFloat(item.custo_unitario_final || item.custo_unitario_original) || 0)}
                              </strong>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-muted">
                            {formatarMoeda(parseFloat(item.preco_unitario_original) || 0)}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {formatarMoeda(parseFloat(item.preco_unitario_final) || 0)}
                          </strong>
                          {parseFloat(item.preco_unitario_original) !== parseFloat(item.preco_unitario_final) && (
                            <small className="text-success d-block">
                              <i className="fas fa-arrow-right me-1"></i>
                              Ajustado
                            </small>
                          )}
                        </td>
                        <td>
                          <Badge bg="info">
                            {(() => {
                              // Se margem_simulada existe, usar ela
                              if (item.margem_simulada !== null && item.margem_simulada !== undefined) {
                                return item.margem_simulada.toFixed(1);
                              }
                              // Senão, calcular margem baseada nos valores
                              const precoFinal = parseFloat(item.preco_unitario_final) || 0;
                              const custoTotal = parseFloat(item.custo_total) || 0;
                              if (precoFinal > 0 && custoTotal > 0) {
                                const margem = ((precoFinal - custoTotal) / precoFinal) * 100;
                                return margem.toFixed(1);
                              }
                              return '0.0';
                            })()}%
                          </Badge>
                        </td>
                        <td>
                          <strong className="text-primary">
                            <i className="fas fa-calculator me-1"></i>
                            {formatarMoeda(parseFloat(item.valor_total) || 0)}
                          </strong>
                        </td>
                        <td>
                          <span className="text-success fw-bold">
                            <i className="fas fa-chart-line me-1"></i>
                            {formatarMoeda(parseFloat(item.lucro_item) || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <th colSpan="5">SUBTOTAL (SEM DESCONTO)</th>
                      <th className="text-info">
                        <i className="fas fa-percentage me-1"></i>
                        <strong>
                          {(() => {
                            const lucroIndividual = venda.itens?.reduce((acc, item) => 
                              acc + (parseFloat(item.lucro_item) || 0), 0) || 0;
                            const margemGeral = calcularMargemGeral(lucroIndividual, venda.subtotal);
                            return `${margemGeral.toFixed(1)}%`;
                          })()}
                        </strong>
                      </th>
                      <th className="text-primary">
                        <i className="fas fa-calculator me-1"></i>
                        <strong>{formatarMoeda(parseFloat(venda.subtotal) || 0)}</strong>
                      </th>
                      <th className="text-success">
                        <i className="fas fa-chart-line me-1"></i>
                        <strong>
                          {(() => {
                            // Calcular lucro antes do desconto (soma dos lucros individuais)
                            const lucroIndividual = venda.itens?.reduce((acc, item) => 
                              acc + (parseFloat(item.lucro_item) || 0), 0) || 0;
                            return formatarMoeda(lucroIndividual);
                          })()}
                        </strong>
                      </th>
                    </tr>
                    {(parseFloat(venda.desconto_valor) || 0) > 0 && (
                      <tr className="table-warning">
                        <th colSpan="6">DESCONTO ({(parseFloat(venda.desconto_percentual) || 0).toFixed(1)}%)</th>
                        <th className="text-warning">
                          <i className="fas fa-minus-circle me-1"></i>
                          <strong>- {formatarMoeda(parseFloat(venda.desconto_valor) || 0)}</strong>
                        </th>
                        <th className="text-warning">
                          <i className="fas fa-minus-circle me-1"></i>
                          <strong>- {formatarMoeda(parseFloat(venda.desconto_valor) || 0)}</strong>
                        </th>
                      </tr>
                    )}
                    <tr className="table-success">
                      <th colSpan="5">TOTAL FINAL</th>
                      <th className="text-dark bg-info">
                        <i className="fas fa-percentage me-1 text-white"></i>
                        <strong className="text-white">
                          {calcularMargemGeral(venda.lucro_total, venda.total).toFixed(1)}%
                        </strong>
                      </th>
                      <th className="text-dark bg-primary">
                        <i className="fas fa-money-bill-wave me-1 text-white"></i>
                        <strong className="text-white">{formatarMoeda(parseFloat(venda.total) || 0)}</strong>
                      </th>
                      <th className="text-dark bg-success">
                        <i className="fas fa-chart-pie me-1 text-white"></i>
                        <strong className="text-white">
                          {formatarMoeda(parseFloat(venda.lucro_total) || 0)}
                        </strong>
                      </th>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5>Tem certeza que deseja excluir esta venda?</h5>
            {venda.status === 'finalizada' ? (
              <div className="alert alert-warning mt-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                <strong>Atenção:</strong> Esta é uma venda finalizada! 
                A exclusão afetará seus relatórios e estatísticas financeiras.
              </div>
            ) : venda.status === 'cancelada' ? (
              <div className="alert alert-info mt-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Venda Cancelada:</strong> Esta venda já foi cancelada e pode ser excluída 
                para limpar o histórico sem afetar relatórios ativos.
              </div>
            ) : (
              <p className="text-muted">
                Esta venda está em rascunho e pode ser excluída sem impacto.
              </p>
            )}
            <p className="text-muted">
              A venda #{venda.id} será permanentemente removida do sistema.
              <strong> Esta ação não pode ser desfeita.</strong>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteVenda}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Excluindo...
              </>
            ) : (
              <>
                <i className="fas fa-trash me-2"></i>
                Excluir Venda
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendaDetalhe;
