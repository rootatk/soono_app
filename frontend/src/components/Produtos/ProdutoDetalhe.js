import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, Alert, 
  Modal, Table, ListGroup
} from 'react-bootstrap';
import produtosService from '../../services/produtos';
import { formatarMoeda } from '../../utils/formatarMoeda';

const ProdutoDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModalExcluir, setShowModalExcluir] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    carregarProduto();
  }, [id]);

  const carregarProduto = async () => {
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

  const handleExcluir = async () => {
    try {
      await produtosService.excluir(id);
      setSuccess('Produto excluído com sucesso!');
      setTimeout(() => {
        navigate('/produtos');
      }, 2000);
    } catch (err) {
      setError('Erro ao excluir produto: ' + err.message);
    } finally {
      setShowModalExcluir(false);
    }
  };

  const calcularMargemLucro = () => {
    if (!produto?.precoVenda || produto.precoVenda === 0) return 0;
    // Fórmula correta para margem: (Preço - Custo) / Preço * 100
    return ((produto.precoVenda - produto.custoTotal) / produto.precoVenda * 100);
  };

  const calcularLucroUnitario = () => {
    return (produto?.precoVenda || 0) - (produto?.custoTotal || 0);
  };

  const getVarianteStatus = (margem) => {
    if (margem < 10) return { bg: 'danger', text: 'Margem Muito Baixa' };
    if (margem < 20) return { bg: 'warning', text: 'Margem Baixa' };
    if (margem < 30) return { bg: 'info', text: 'Margem Boa' };
    return { bg: 'success', text: 'Margem Excelente' };
  };

  const custoInsumos = produto?.insumosCompletos?.reduce((total, insumo) => 
    total + (insumo.custoTotal || 0), 0) || 0;
  
  const custoMaoDeObra = (produto?.maoDeObraHoras || 0) * (produto?.maoDeObraCustoHora || 0);

  const custoAdicionalTotal = produto?.custosAdicionais 
    ? Object.values(produto.custosAdicionais).reduce((total, custo) => total + (parseFloat(custo) || 0), 0)
    : 0;

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

  if (!produto) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Produto não encontrado.
          <div className="mt-2">
            <Button variant="outline-primary" onClick={() => navigate('/produtos')}>
              Voltar para Lista
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const margem = calcularMargemLucro();
  const statusMargem = getVarianteStatus(margem);

  return (
    <Container className="mt-4">
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
                  onClick={() => navigate('/produtos')}
                >
                  Produtos
                </span>
              </li>
              <li className="breadcrumb-item active">
                {produto.nome}
              </li>
            </ol>
          </nav>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Row>
            {/* Informações Principais */}
            <Col lg={8}>
              {produto.imagemUrl && (
                <Card className="mb-4 shadow-sm">
                  <div className="image-detail-container" style={{ backgroundColor: '#f8f9fa', padding: '20px', textAlign: 'center' }}>
                    <Card.Img 
                      variant="top" 
                      src={`http://localhost:3001${produto.imagemUrl}`} 
                      style={{ 
                        maxHeight: '500px', 
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        cursor: 'zoom-in',
                        transition: 'transform 0.3s ease',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      onClick={() => setShowImageModal(true)}
                    />
                  </div>
                </Card>
              )}
              <Card className="card-soono mb-4">
                <Card.Header className="bg-soono-primary">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0 text-soono-brown">{produto.nome}</h4>
                    <Badge bg={statusMargem.bg} className="fs-6">
                      {statusMargem.text}
                    </Badge>
                  </div>
                </Card.Header>

                <Card.Body>
                  {produto.categoria && (
                    <div className="mb-3">
                      <Badge bg="secondary" className="fs-6">
                        {produto.categoria}
                      </Badge>
                    </div>
                  )}

                  {produto.descricao && (
                    <div className="mb-4">
                      <h6>Descrição</h6>
                      <p className="text-muted">{produto.descricao}</p>
                    </div>
                  )}

                  {/* Resumo Financeiro */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <Card className="bg-light h-100">
                        <Card.Body className="text-center">
                          <h5 className="text-primary mb-1">
                            {formatarMoeda(produto.custoTotal || 0)}
                          </h5>
                          <small className="text-muted">Custo Total</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-success text-white h-100">
                        <Card.Body className="text-center">
                          <h5 className="mb-1">
                            {formatarMoeda(produto.precoVenda || 0)}
                          </h5>
                          <small>Preço de Venda</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Card className="bg-info text-white h-100">
                        <Card.Body className="text-center">
                          <h6 className="mb-1">{margem.toFixed(1)}%</h6>
                          <small>Margem de Lucro</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-warning text-white h-100">
                        <Card.Body className="text-center">
                          <h6 className="mb-1">
                            {formatarMoeda(calcularLucroUnitario())}
                          </h6>
                          <small>Lucro por Unidade</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-secondary text-white h-100">
                        <Card.Body className="text-center">
                          <h6 className="mb-1">{produto.insumos?.length || 0}</h6>
                          <small>Insumos Usados</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Insumos Detalhados */}
              {produto.insumosCompletos && produto.insumosCompletos.length > 0 && (
                <Card className="card-soono mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Insumos Utilizados</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Insumo</th>
                            <th className="text-center">Quantidade</th>
                            <th className="text-center">Unidade</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produto.insumosCompletos.map((insumo, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{insumo.nome}</strong>
                                {insumo.variacao && (
                                  <Badge bg="light" text="dark" className="ms-2 small">
                                    {insumo.variacao}
                                  </Badge>
                                )}
                              </td>
                              <td className="text-center">{insumo.quantidade}</td>
                              <td className="text-center">{insumo.unidade}</td>
                              <td className="text-end">
                                <strong>
                                  {formatarMoeda(insumo.custoTotal)}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <th colSpan="3">Subtotal Insumos:</th>
                            <th className="text-end">
                              {formatarMoeda(custoInsumos)}
                            </th>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Painel Lateral */}
            <Col lg={4}>
              {/* Mão de Obra */}
              <Card className="card-soono mb-4">
                <Card.Header>
                  <h6 className="mb-0">Mão de Obra</h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Horas trabalhadas:</span>
                      <strong>{produto.maoDeObraHoras || 0}h</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Valor por hora:</span>
                      <strong>{formatarMoeda(produto.maoDeObraCustoHora || 0)}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0 border-top">
                      <span>Custo total:</span>
                      <strong className="text-primary">
                        {formatarMoeda(custoMaoDeObra)}
                      </strong>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Composição de Custos */}
              <Card className="card-soono mb-4">
                <Card.Header>
                  <h6 className="mb-0">Composição de Custos</h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Insumos:</span>
                      <span>{formatarMoeda(custoInsumos)}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Mão de obra:</span>
                      <span>{formatarMoeda(custoMaoDeObra)}</span>
                    </ListGroup.Item>
                    {produto.custosAdicionais && custoAdicionalTotal > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0">
                        <span>Custos Adicionais:</span>
                        <span>{formatarMoeda(custoAdicionalTotal)}</span>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.sacoPlastico > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Saco Plástico:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.sacoPlastico)}</small>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.caixaSacola > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Caixa/Sacola:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.caixaSacola)}</small>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.tag > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Tag:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.tag)}</small>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.adesivoLogo > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Adesivo da Logo:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.adesivoLogo)}</small>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.brinde > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Brinde:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.brinde)}</small>
                      </ListGroup.Item>
                    )}
                    {produto.custosAdicionais?.outros > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between px-0 ps-4">
                        <small>Outros Custos:</small>
                        <small>{formatarMoeda(produto.custosAdicionais.outros)}</small>
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item className="d-flex justify-content-between px-0 border-top">
                      <strong>Total:</strong>
                      <strong className="text-primary">
                        {formatarMoeda(produto.custoTotal || 0)}
                      </strong>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Ações */}
              <Card className="card-soono">
                <Card.Header>
                  <h6 className="mb-0">Ações</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button
                      variant="warning"
                      onClick={() => navigate(`/produtos/${id}/editar`)}
                    >
                      Editar Produto
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => navigate('/calculadora', { 
                        state: { produtoId: id, produtoNome: produto.nome } 
                      })}
                    >
                      Simular Preços
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate('/produtos')}
                    >
                      Voltar à Lista
                    </Button>
                    <hr />
                    <Button
                      variant="outline-danger"
                      onClick={() => setShowModalExcluir(true)}
                    >
                      Excluir Produto
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showModalExcluir} onHide={() => setShowModalExcluir(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Atenção!</strong> Tem certeza que deseja excluir o produto "{produto.nome}"?
          </Alert>
          <p>Esta ação não pode ser desfeita e irá remover permanentemente:</p>
          <ul>
            <li>Todas as informações do produto</li>
            <li>Composição de insumos</li>
            <li>Configurações de preço e margem</li>
          </ul>
          <small className="text-muted">
            Nota: As vendas já realizadas deste produto serão mantidas no histórico.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalExcluir(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleExcluir}>
            Sim, Excluir Produto
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Visualização de Imagem */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Imagem - {produto?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-2">
          {produto?.imagemUrl && (
            <img
              src={`http://localhost:3001${produto.imagemUrl}`}
              alt={`Imagem de ${produto.nome}`}
              className="img-fluid rounded"
              style={{ maxHeight: '80vh', maxWidth: '100%' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProdutoDetalhe;