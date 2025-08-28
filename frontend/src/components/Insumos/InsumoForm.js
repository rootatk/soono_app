// src/components/Insumos/InsumoForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { insumoService } from '../../services/insumos';
import { formatarMoeda } from '../../utils/formatarMoeda';

const InsumoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    custoUnitario: '',
    estoqueAtual: '',
    estoqueMinimo: '',
    unidade: 'unidade',
    variacao: '',
    fornecedor: '',
    observacoes: ''
  });

  const categorias = [
    'Linhas e Fios',
    'Miçangas',
    'Fechos',
    'Pingentes',
    'Cordões',
    'Ferramentas',
    'Acessórios',
    'Outros'
  ];

  const unidades = [
    'unidade',
    'metro',
    'centímetro',
    'grama',
    'quilograma',
    'rolo',
    'pacote'
  ];

  // Variações A-Z para bijuteria
  const variacoes = Array.from({ length: 26 }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  useEffect(() => {
    if (isEdit && id) {
      carregarInsumo();
    }
  }, [id, isEdit]);

  const carregarInsumo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const insumo = await insumoService.buscarPorId(id);
      
      if (insumo) {
        setFormData({
          nome: insumo.nome || '',
          categoria: insumo.categoria || '',
          custoUnitario: insumo.custoUnitario?.toString() || '',
          estoqueAtual: insumo.estoqueAtual?.toString() || '',
          estoqueMinimo: insumo.estoqueMinimo?.toString() || '',
          unidade: insumo.unidade || 'unidade',
          variacao: insumo.variacao || '',
          fornecedor: insumo.fornecedor || '',
          observacoes: insumo.observacoes || ''
        });
      }
    } catch (err) {
      console.error('Erro ao carregar insumo:', err);
      setError('Erro ao carregar dados do insumo');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar mensagens ao digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.categoria) {
      setError('Categoria é obrigatória');
      return false;
    }

    if (!formData.custoUnitario || parseFloat(formData.custoUnitario) <= 0) {
      setError('Custo unitário deve ser maior que zero');
      return false;
    }

    if (!formData.estoqueAtual || parseFloat(formData.estoqueAtual) < 0) {
      setError('Quantidade em estoque deve ser maior ou igual a zero');
      return false;
    }

    if (!formData.estoqueMinimo || parseFloat(formData.estoqueMinimo) < 0) {
      setError('Estoque mínimo deve ser maior ou igual a zero');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const dadosParaEnvio = {
        nome: formData.nome,
        categoria: formData.categoria,
        custoUnitario: parseFloat(formData.custoUnitario),
        unidade: formData.unidade,
        estoqueAtual: parseFloat(formData.estoqueAtual),
        estoqueMinimo: parseFloat(formData.estoqueMinimo),
        variacao: formData.variacao || null,
        fornecedor: formData.fornecedor,
        observacoes: formData.observacoes,
      };

      let response;
      if (isEdit) {
        response = await insumoService.atualizar(id, dadosParaEnvio);
        setSuccess('Insumo atualizado com sucesso!');
      } else {
        response = await insumoService.criar(dadosParaEnvio);
        setSuccess('Insumo cadastrado com sucesso!');
      }

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/insumos');
      }, 1500);

    } catch (err) {
      console.error('Erro ao salvar insumo:', err);
      setError(
        err.response?.data?.message || 
        `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} insumo`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados do insumo...</p>
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
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </span>
              </li>
              <li className="breadcrumb-item">
                <span 
                  className="text-decoration-underline" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/insumos')}
                >
                  Insumos
                </span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {isEdit ? 'Editar Insumo' : 'Novo Insumo'}
              </li>
            </ol>
          </nav>

          {/* Título */}
          <Row className="mb-4">
            <Col>
              <h2 className="text-soono-brown">
                {isEdit ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}
              </h2>
            </Col>
          </Row>

          {/* Alertas */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          {/* Formulário */}
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="card-soono">
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Nome */}
                      <Col md={8} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="nome">Nome do Insumo *</Form.Label>
                          <Form.Control
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            placeholder="Ex: Linha de algodão azul"
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Variação */}
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="variacao">Variação</Form.Label>
                          <Form.Select
                            id="variacao"
                            name="variacao"
                            value={formData.variacao}
                            onChange={handleInputChange}
                          >
                            <option value="">Selecione...</option>
                            {variacoes.map(variacao => (
                              <option key={variacao} value={variacao}>
                                {variacao}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      {/* Categoria */}
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="categoria">Categoria *</Form.Label>
                          <Form.Select
                            id="categoria"
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione uma categoria</option>
                            {categorias.map(categoria => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {/* Unidade de Medida */}
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="unidade">Unidade de Medida *</Form.Label>
                          <Form.Select
                            id="unidade"
                            name="unidade"
                            value={formData.unidade}
                            onChange={handleInputChange}
                            required
                          >
                            {unidades.map(unidade => (
                              <option key={unidade} value={unidade}>
                                {unidade}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      {/* Custo Unitário */}
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="custoUnitario">Custo Unitário *</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>R$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              id="custoUnitario"
                              name="custoUnitario"
                              value={formData.custoUnitario}
                              onChange={handleInputChange}
                              placeholder="0,00"
                              step="0.01"
                              min="0"
                              required
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      {/* Quantidade em Estoque */}
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="estoqueAtual">Qtd. em Estoque *</Form.Label>
                          <Form.Control
                            type="number"
                            id="estoqueAtual"
                            name="estoqueAtual"
                            value={formData.estoqueAtual}
                            onChange={handleInputChange}
                            placeholder="0"
                            step="0.01"
                            min="0"
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Estoque Mínimo */}
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label htmlFor="estoqueMinimo">Estoque Mínimo *</Form.Label>
                          <Form.Control
                            type="number"
                            id="estoqueMinimo"
                            name="estoqueMinimo"
                            value={formData.estoqueMinimo}
                            onChange={handleInputChange}
                            placeholder="5"
                            step="0.01"
                            min="0"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Fornecedor */}
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="fornecedor">Fornecedor</Form.Label>
                      <Form.Control
                        type="text"
                        id="fornecedor"
                        name="fornecedor"
                        value={formData.fornecedor}
                        onChange={handleInputChange}
                        placeholder="Nome do fornecedor ou loja"
                      />
                    </Form.Group>

                    {/* Observações */}
                    <Form.Group className="mb-4">
                      <Form.Label htmlFor="observacoes">Observações</Form.Label>
                      <Form.Control
                        as="textarea"
                        id="observacoes"
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Informações adicionais sobre o insumo..."
                      />
                    </Form.Group>

                    {/* Preview de Valores */}
                    {formData.custoUnitario && formData.estoqueAtual && (
                      <Alert variant="info">
                        <h6 className="mb-2">
                          <i className="fas fa-calculator me-2"></i>
                          Resumo dos Valores:
                        </h6>
                        <Row>
                          <Col md={6}>
                            <strong>Valor Total em Estoque:</strong><br />
                            {formatarMoeda(
                              parseFloat(formData.custoUnitario || 0) * 
                              parseFloat(formData.estoqueAtual || 0)
                            )}
                          </Col>
                          <Col md={6}>
                            <strong>Custo por {formData.unidade}:</strong><br />
                            {formatarMoeda(parseFloat(formData.custoUnitario || 0))}
                          </Col>
                        </Row>
                      </Alert>
                    )}

                    {/* Botões */}
                    <Row>
                      <Col>
                        <div className="d-flex justify-content-between">
                          <Button
                            variant="outline-secondary"
                            onClick={() => navigate('/insumos')}
                            disabled={loading}
                          >
                            <i className="fas fa-arrow-left me-2"></i>
                            Cancelar
                          </Button>

                          <Button
                            type="submit"
                            variant="primary"
                            className="btn-soono-primary"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
                                {isEdit ? 'Atualizar Insumo' : 'Cadastrar Insumo'}
                              </>
                            )}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default InsumoForm;