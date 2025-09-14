import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { formatarMoeda, formatarNumero } from '../utils/formatarMoeda';
import { estatisticaService } from '../services/estatisticas';
import vendasService from '../services/vendas';
import { insumoService } from '../services/insumos';
import { formatDateForDisplay } from '../utils/dateUtils';

const Dashboard = () => {
  const [metricas, setMetricas] = useState(null);
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      // Carregar dados em paralelo
      const [
        metricasData,
        vendasRecentesData,
        estoqueBaixoData
      ] = await Promise.all([
        estatisticaService.metricas(),
        vendasService.buscarRecentes(5),
        insumoService.buscarEstoqueBaixo()
      ]);

      console.log('INSUMOS ESTOQUE BAIXO:', estoqueBaixoData);
      console.log('MÉTRICAS COMPLETAS:', metricasData);

      setMetricas(metricasData);
      setVendasRecentes(vendasRecentesData);
      setInsumosEstoqueBaixo(estoqueBaixoData);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setErro('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="main-container">
        <div className="loading-spinner">
          <Spinner animation="border" className="spinner-border-soono" />
          <span className="ms-2">Carregando dashboard...</span>
        </div>
      </Container>
    );
  }

  if (erro) {
    return (
      <Container className="main-container">
        <Alert variant="danger" className="alert-soono-danger">
          {erro}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="main-container">
      {/* Título */}
      <Row className="mb-4">
        <Col>
          <h1 className="text-soono-brown">📊 Dashboard - Sóonó Atelier</h1>
          <p className="text-muted">Visão geral do seu negócio</p>
        </Col>
      </Row>

      {/* Alertas de Estoque Baixo */}
      {insumosEstoqueBaixo.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="alert-soono-warning">
              <h5>⚠️ Atenção - Estoque Baixo!</h5>
              <p className="mb-2">
                <strong>{insumosEstoqueBaixo.length}</strong> insumo(s) com estoque baixo:
              </p>
              <ul className="mb-0">
                {insumosEstoqueBaixo.slice(0, 3).map(insumo => (
                  <li key={insumo.id}>
                    <strong>{insumo.nome}</strong> - {insumo.estoqueAtual} {insumo.unidade} restante(s)
                  </li>
                ))}
                {insumosEstoqueBaixo.length > 3 && (
                  <li>... e mais {insumosEstoqueBaixo.length - 3} item(s)</li>
                )}
              </ul>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Widgets de Métricas */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">💰</div>
            <div className="dashboard-widget-value">
              {formatarMoeda(metricas?.financeiro?.faturamentoAno || 0)}
            </div>
            <div className="dashboard-widget-label">Faturamento Total</div>
          </div>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">📦</div>
            <div className="dashboard-widget-value">
              {formatarMoeda(metricas?.estoque?.valorTotalInsumos || 0)}
            </div>
            <div className="dashboard-widget-label">Valor em Estoque</div>
          </div>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">📈</div>
            <div className="dashboard-widget-value">
              {formatarMoeda(metricas?.financeiro?.lucroAno || 0)}
            </div>
            <div className="dashboard-widget-label">Lucro Estimado</div>
          </div>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">🛒</div>
            <div className="dashboard-widget-value">
              {formatarNumero(metricas?.contadores?.vendas || 0)}
            </div>
            <div className="dashboard-widget-label">Vendas Realizadas</div>
          </div>
        </Col>
      </Row>

      {/* Widgets Secundários */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">🎨</div>
            <div className="dashboard-widget-value">
              {formatarNumero(metricas?.contadores?.produtos || 0)}
            </div>
            <div className="dashboard-widget-label">Produtos Cadastrados</div>
          </div>
        </Col>

        <Col md={4} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">🧵</div>
            <div className="dashboard-widget-value">
              {formatarNumero(metricas?.contadores?.insumos || 0)}
            </div>
            <div className="dashboard-widget-label">Insumos Cadastrados</div>
          </div>
        </Col>

        <Col md={4} className="mb-3">
          <div className="dashboard-widget fade-in-up">
            <div className="dashboard-widget-icon">⚠️</div>
            <div className="dashboard-widget-value">
              {formatarNumero(metricas?.estoque?.insumosEstoqueBaixo || 0)}
            </div>
            <div className="dashboard-widget-label">Alertas de Estoque</div>
          </div>
        </Col>
      </Row>

      {/* Vendas Recentes */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="card-soono">
            <Card.Header>
              <h5 className="mb-0">📋 Vendas Recentes</h5>
            </Card.Header>
            <Card.Body>
              {vendasRecentes.length === 0 ? (
                <p className="text-muted text-center py-3">
                  Nenhuma venda registrada ainda.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-soono mb-0">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendasRecentes.map(venda => (
                        <tr key={venda.id}>
                          <td>
                            {formatDateForDisplay(venda.data)}
                          </td>
                          <td>
                            <strong>
                              {venda.itens && venda.itens.length > 0 
                                ? venda.itens.length === 1 
                                  ? venda.itens[0].produto_nome 
                                  : `${venda.itens.length} produtos`
                                : 'N/A'
                              }
                            </strong>
                          </td>
                          <td>{venda.cliente || 'Cliente não informado'}</td>
                          <td>
                            <span className="badge-soono-primary">
                              {formatarMoeda(venda.total)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Resumo Rápido */}
        <Col lg={4} className="mb-4">
          <Card className="card-soono">
            <Card.Header>
              <h5 className="mb-0">🎯 Resumo Rápido</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <small className="text-muted">MAIOR FATURAMENTO</small>
                <p className="mb-1 fw-bold">Este Mês</p>
                <p className="text-soono-brown">
                  {formatarMoeda(metricas?.financeiro?.faturamentoMes || 0)}
                </p>
              </div>

              <div className="mb-3">
                <small className="text-muted">MARGEM MÉDIA</small>
                <p className="mb-1 fw-bold">Este Mês</p>
                <p className="text-soono-gold">
                  {(metricas?.financeiro?.margemMes || 0).toFixed(1)}%
                </p>
              </div>

              <div className="mb-0">
                <small className="text-muted">STATUS GERAL</small>
                <div className="mt-2">
                  {insumosEstoqueBaixo.length === 0 ? (
                    <span className="badge bg-success">✅ Tudo OK</span>
                  ) : (
                    <span className="badge-soono-warning">
                      ⚠️ {insumosEstoqueBaixo.length} alerta(s)
                    </span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;