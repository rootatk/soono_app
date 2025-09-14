import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Badge, Button, Nav, Form } from 'react-bootstrap';
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

  // Export states
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

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
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Format month from YYYY-MM to user-friendly display
  const formatMonth = (yearMonth) => {
    if (!yearMonth) return '-';
    
    try {
      const [year, month] = yearMonth.split('-');
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    } catch (error) {
      console.warn('Error formatting month:', yearMonth, error);
      return yearMonth; // Fallback to original format
    }
  };

  // Initialize date range with current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportStartDate(firstDay.toISOString().split('T')[0]);
    setExportEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Export functions
  const handleExportExcel = async () => {
    if (!exportStartDate || !exportEndDate) {
      setError('Por favor, selecione as datas inicial e final');
      return;
    }

    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      setError('Data inicial deve ser anterior à data final');
      return;
    }

    try {
      setExportLoading(true);
      setError(null);

      const response = await fetch(`/api/vendas/export/excel?startDate=${exportStartDate}&endDate=${exportEndDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao exportar dados');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `vendas_${exportStartDate}_ate_${exportEndDate}.xlsx`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ Arquivo exportado: ${filename}`);

    } catch (error) {
      console.error('❌ Erro no export:', error);
      setError(`Erro ao exportar: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const setQuickDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    setExportStartDate(startDate.toISOString().split('T')[0]);
    setExportEndDate(endDate.toISOString().split('T')[0]);
  };

  const renderExportSection = () => {
    return (
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">📋 Exportar Vendas Detalhadas</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Exporte dados completos com: Data da Venda, Cliente, Produtos, Quantidade, Total Final e Lucro Total
          </p>
          
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Inicial</Form.Label>
                <Form.Control
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Final</Form.Label>
                <Form.Control
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <div className="d-flex gap-2 flex-wrap">
                <Button variant="outline-secondary" size="sm" onClick={() => setQuickDateRange(30)}>
                  Últimos 30 dias
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setQuickDateRange(90)}>
                  Últimos 3 meses
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setQuickDateRange(365)}>
                  Último ano
                </Button>
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <Button 
                variant="success" 
                onClick={handleExportExcel}
                disabled={exportLoading || !exportStartDate || !exportEndDate}
              >
                {exportLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Exportando...
                  </>
                ) : (
                  <>
                    📊 Exportar Excel
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
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
      <div>
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
                  <th>Quantidade de Produtos</th>
                  <th>Faturamento</th>
                  <th>Lucro</th >
                  <th>Ticket Médio</th>
                  <th>Vendas 2+ Itens</th>
                </tr>
              </thead>
              <tbody>
                {vendasMensais.map((mes) => (
                  <tr key={mes.mes}>
                    <td>{formatMonth(mes.mes)}</td>
                    <td>{mes.numeroVendas}</td>
                    <td>{mes.quantidade}</td>
                    <td>{formatarMoeda(mes.faturamento)}</td>
                    <td className="text-success">{formatarMoeda(mes.lucro)}</td>
                    <td>{formatarMoeda(mes.ticketMedio)}</td>
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
        
        {renderExportSection()}
      </div>
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

  const tabs = [
    { key: 'resumo', label: '📊 Resumo Geral', icon: 'fas fa-chart-pie' },
    { key: 'vendas', label: '📈 Vendas Mensais', icon: 'fas fa-chart-line' },
    { key: 'insumos', label: '🧶 Insumos', icon: 'fas fa-boxes' },
    { key: 'rentabilidade', label: '💰 Rentabilidade', icon: 'fas fa-dollar-sign' }
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
        </div>
      )}
    </Container>
  );
};

export default Estatisticas;