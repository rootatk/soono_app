import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Badge, Button, Nav } from 'react-bootstrap';
import { formatarMoeda, formatarNumero } from '../utils/formatarMoeda';
import { estatisticaService } from '../services/estatisticas';

const Estatisticas = () => {
  const [activeTab, setActiveTab] = useState('resumo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [resumoData, setResumoData] = useState(null);
  const [vendasMensais, setVendasMensais] = useState([]);
  const [insumosMaisUsados, setInsumosMaisUsados] = useState([]);
  const [rentabilidade, setRentabilidade] = useState(null);
  const [previsaoEstoque, setPrevisaoEstoque] = useState(null);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'resumo':
          if (!resumoData) {
            const data = await estatisticaService.resumoGeral();
            setResumoData(data);
          }
          break;

        case 'vendas':
          if (vendasMensais.length === 0) {
            const data = await estatisticaService.evolucaoVendas();
            setVendasMensais(data);
          }
          break;

        case 'insumos':
          if (insumosMaisUsados.length === 0) {
            const data = await estatisticaService.insumosMaisUsados();
            setInsumosMaisUsados(data);
          }
          break;

        case 'rentabilidade':
          if (!rentabilidade) {
            const data = await estatisticaService.analiseRentabilidade();
            setRentabilidade(data);
          }
          break;

        case 'estoque':
          if (!previsaoEstoque) {
            const data = await estatisticaService.previsaoEstoque();
            setPrevisaoEstoque(data);
          }
          break;
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderResumoGeral = () => {
    if (!resumoData) return null;

    return (
      <div>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h2 className="text-primary">{resumoData.contadores?.insumos || 0}</h2>
                <p className="mb-0">Insumos Ativos</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h2 className="text-success">{resumoData.contadores?.produtos || 0}</h2>
                <p className="mb-0">Produtos Ativos</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h2 className="text-info">{resumoData.contadores?.vendas || 0}</h2>
                <p className="mb-0">Total de Vendas</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h2 className="text-warning">{resumoData.contadores?.vendasMes || 0}</h2>
                <p className="mb-0">Vendas Este Mês</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {resumoData.descontosProgressivos && (
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">🎯 Sistema de Desconto Progressivo</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-success">{formatarMoeda(resumoData.descontosProgressivos.totalEconomizado || 0)}</h4>
                        <small className="text-muted">Total Economizado (R$ 1,00/item)</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-primary">{resumoData.descontosProgressivos.vendasMultiplosItens || 0}</h4>
                        <small className="text-muted">Vendas com Múltiplos Itens</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-info">{resumoData.descontosProgressivos.vendasComDesconto || 0}</h4>
                        <small className="text-muted">Itens com Desconto</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="text-center">
                        <h4 className="text-warning">{(resumoData.descontosProgressivos.margemMelhorada || 0).toFixed(2)}%</h4>
                        <small className="text-muted">Melhoria na Margem</small>
                      </div>
                    </Col>
                  </Row>
                  <hr />
                  <div className="text-center">
                    <p className="mb-0">
                      <strong>Impacto do Sistema:</strong> O desconto progressivo de custo está gerando{' '}
                      <Badge bg="success">{formatarMoeda(resumoData.descontosProgressivos.totalEconomizado || 0)}</Badge> em economia 
                      adicional este mês, melhorando a margem em{' '}
                      <Badge bg="primary">{(resumoData.descontosProgressivos.margemMelhorada || 0).toFixed(2)}%</Badge>
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">💰 Financeiro</h5>
              </Card.Header>
              <Card.Body>
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Faturamento do Mês:</strong></td>
                      <td className="text-end">{formatarMoeda(resumoData.financeiro?.faturamentoMes || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Lucro do Mês:</strong></td>
                      <td className="text-end text-success">{formatarMoeda(resumoData.financeiro?.lucroMes || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Faturamento do Ano:</strong></td>
                      <td className="text-end">{formatarMoeda(resumoData.financeiro?.faturamentoAno || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Lucro do Ano:</strong></td>
                      <td className="text-end text-success">{formatarMoeda(resumoData.financeiro?.lucroAno || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Margem do Mês:</strong></td>
                      <td className="text-end">
                        <Badge bg="primary">{(resumoData.financeiro?.margemMes || 0).toFixed(1)}%</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Ticket Médio:</strong></td>
                      <td className="text-end">{formatarMoeda(resumoData.financeiro?.ticketMedioMes || 0)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📦 Estoque</h5>
              </Card.Header>
              <Card.Body>
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Valor Estoque Insumos:</strong></td>
                      <td className="text-end">{formatarMoeda(resumoData.estoque?.valorTotalInsumos || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Valor Estoque Produtos:</strong></td>
                      <td className="text-end">{formatarMoeda(resumoData.estoque?.valorEstoqueProdutos || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Faturamento Potencial:</strong></td>
                      <td className="text-end text-success">{formatarMoeda(resumoData.estoque?.faturamentoPotencial || 0)}</td>
                    </tr>
                    <tr>
                      <td><strong>Insumos Estoque Baixo:</strong></td>
                      <td className="text-end">
                        {resumoData.estoque?.insumosEstoqueBaixo > 0 ? (
                          <Badge bg="danger">{resumoData.estoque.insumosEstoqueBaixo}</Badge>
                        ) : (
                          <Badge bg="success">0</Badge>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {resumoData.produtosMaisLucrativos && resumoData.produtosMaisLucrativos.length > 0 && (
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">🏆 Top 5 Produtos Mais Lucrativos</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Preço</th>
                        <th>Lucro/Unidade</th>
                        <th>Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumoData.produtosMaisLucrativos.map((produto, index) => (
                        <tr key={produto.id}>
                          <td>
                            <Badge bg={index === 0 ? 'warning' : 'secondary'} className="me-2">
                              {index + 1}º
                            </Badge>
                            {produto.nome}
                          </td>
                          <td>{formatarMoeda(produto.precoVenda)}</td>
                          <td className="text-success">{formatarMoeda(produto.lucroUnidade)}</td>
                          <td>
                            <Badge bg="primary">{produto.margemReal.toFixed(1)}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  const renderVendasMensais = () => {
    if (vendasMensais.length === 0) return null;

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">📈 Evolução de Vendas - Últimos 12 Meses</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Vendas</th>
                <th>Quantidade</th>
                <th>Faturamento</th>
                <th>Lucro</th>
                <th>Ticket Médio</th>
                <th>Desconto Progressivo</th>
                <th>Vendas 2+ Itens</th>
              </tr>
            </thead>
            <tbody>
              {vendasMensais.map((mes) => (
                <tr key={mes.mes}>
                  <td>{mes.mes}</td>
                  <td>{mes.numeroVendas}</td>
                  <td>{mes.quantidade}</td>
                  <td>{formatarMoeda(mes.faturamento)}</td>
                  <td className="text-success">{formatarMoeda(mes.lucro)}</td>
                  <td>{formatarMoeda(mes.ticketMedio)}</td>
                  <td className="text-primary">
                    {formatarMoeda(mes.descontoProgressivo || 0)}
                    {mes.margemMelhoradaProgressivo > 0 && (
                      <small className="d-block text-muted">
                        +{mes.margemMelhoradaProgressivo.toFixed(2)}% margem
                      </small>
                    )}
                  </td>
                  <td>
                    <Badge bg={mes.vendasMultiplosItens > 0 ? 'success' : 'secondary'}>
                      {mes.vendasMultiplosItens || 0}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderInsumosMaisUsados = () => {
    if (insumosMaisUsados.length === 0) return null;

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">🧶 Insumos Mais Utilizados</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Categoria</th>
                <th>Qtd. Total Usada</th>
                <th>Produtos</th>
                <th>Valor Total</th>
                <th>Custo Unitário</th>
              </tr>
            </thead>
            <tbody>
              {insumosMaisUsados.map((insumo) => (
                <tr key={insumo.insumoId}>
                  <td>
                    <strong>{insumo.nome}</strong>
                    {insumo.variacao && <small className="text-muted d-block">{insumo.variacao}</small>}
                  </td>
                  <td>{insumo.categoria}</td>
                  <td>{formatarNumero(insumo.quantidadeTotalUsada)} {insumo.unidade}</td>
                  <td>{insumo.produtosQueUtilizam}</td>
                  <td className="text-success">{formatarMoeda(insumo.valorTotalUtilizado)}</td>
                  <td>{formatarMoeda(insumo.custoUnitario)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderRentabilidade = () => {
    if (!rentabilidade) return null;

    return (
      <div>
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h5>🥇 Mais Lucrativo</h5>
                <p className="mb-1"><strong>{rentabilidade.estatisticas?.produtoMaisLucrativo?.nome}</strong></p>
                <p className="text-success mb-0">{formatarMoeda(rentabilidade.estatisticas?.produtoMaisLucrativo?.lucroUnidade || 0)}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h5>📊 Margem Média</h5>
                <h3 className="text-primary">{(rentabilidade.estatisticas?.margemMedia || 0).toFixed(1)}%</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center">
              <Card.Body>
                <h5>💰 Lucro Médio</h5>
                <h3 className="text-success">{formatarMoeda(rentabilidade.estatisticas?.lucroMedioPorUnidade || 0)}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card>
          <Card.Header>
            <h5 className="mb-0">📊 Análise de Rentabilidade por Produto</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Custo</th>
                  <th>Preço</th>
                  <th>Lucro</th>
                  <th>Margem Real</th>
                  <th>Margem Config.</th>
                </tr>
              </thead>
              <tbody>
                {rentabilidade.produtos?.map((produto) => (
                  <tr key={produto.id}>
                    <td><strong>{produto.nome}</strong></td>
                    <td>{produto.categoria}</td>
                    <td>{formatarMoeda(produto.custoTotal)}</td>
                    <td>{formatarMoeda(produto.precoVenda)}</td>
                    <td className="text-success">{formatarMoeda(produto.lucroUnidade)}</td>
                    <td>
                      <Badge bg={produto.margemReal >= 30 ? 'success' : produto.margemReal >= 20 ? 'warning' : 'danger'}>
                        {produto.margemReal.toFixed(1)}%
                      </Badge>
                    </td>
                    <td>{produto.margemConfigurada.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderPrevisaoEstoque = () => {
    if (!previsaoEstoque) return null;

    const getSituacaoColor = (situacao) => {
      switch (situacao) {
        case 'critico': return 'danger';
        case 'alerta': return 'warning';
        case 'atencao': return 'info';
        case 'ok': return 'success';
        default: return 'secondary';
      }
    };

    return (
      <div>
        <Row className="mb-4">
          <Col md={2}>
            <Card className="text-center border-danger">
              <Card.Body>
                <h3 className="text-danger">{previsaoEstoque.resumo?.criticos || 0}</h3>
                <small>Críticos</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h3 className="text-warning">{previsaoEstoque.resumo?.alertas || 0}</h3>
                <small>Alertas</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-info">
              <Card.Body>
                <h3 className="text-info">{previsaoEstoque.resumo?.atencao || 0}</h3>
                <small>Atenção</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center border-success">
              <Card.Body>
                <h3 className="text-success">{previsaoEstoque.resumo?.ok || 0}</h3>
                <small>OK</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-muted">{previsaoEstoque.resumo?.semConsumo || 0}</h3>
                <small>Sem Consumo</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card>
          <Card.Header>
            <h5 className="mb-0">⏰ Previsão de Esgotamento - {previsaoEstoque.parametros?.diasAnalise} dias</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Estoque Atual</th>
                  <th>Consumo Diário</th>
                  <th>Dias p/ Esgotar</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {previsaoEstoque.previsoes?.map((prev) => (
                  <tr key={prev.id}>
                    <td>
                      <strong>{prev.nome}</strong>
                      {prev.variacao && <small className="text-muted d-block">{prev.variacao}</small>}
                    </td>
                    <td>{formatarNumero(prev.estoqueAtual)}</td>
                    <td>{formatarNumero(prev.consumoDiario)}</td>
                    <td>
                      {prev.diasParaEsgotar !== null ? (
                        <span className={prev.diasParaEsgotar <= 7 ? 'text-danger fw-bold' : ''}>
                          {prev.diasParaEsgotar} dias
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={getSituacaoColor(prev.situacao)}>
                        {prev.situacao.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const tabs = [
    { key: 'resumo', label: '📊 Resumo Geral', icon: 'fas fa-chart-pie' },
    { key: 'vendas', label: '📈 Vendas Mensais', icon: 'fas fa-chart-line' },
    { key: 'insumos', label: '🧶 Insumos', icon: 'fas fa-boxes' },
    { key: 'rentabilidade', label: '💰 Rentabilidade', icon: 'fas fa-dollar-sign' },
    { key: 'estoque', label: '📦 Previsão Estoque', icon: 'fas fa-warehouse' }
  ];

  return (
    <Container className="py-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-0">📈 Estatísticas e Relatórios</h1>
          <p className="text-muted">Análise completa do seu negócio</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab}>
            {tabs.map(tab => (
              <Nav.Item key={tab.key}>
                <Nav.Link eventKey={tab.key}>
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Carregando dados...</p>
        </div>
      )}

      {!loading && (
        <div>
          {activeTab === 'resumo' && renderResumoGeral()}
          {activeTab === 'vendas' && renderVendasMensais()}
          {activeTab === 'insumos' && renderInsumosMaisUsados()}
          {activeTab === 'rentabilidade' && renderRentabilidade()}
          {activeTab === 'estoque' && renderPrevisaoEstoque()}
        </div>
      )}
    </Container>
  );
};

export default Estatisticas;