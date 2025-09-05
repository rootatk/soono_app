import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import produtosService from '../../services/produtos';
import { insumoService } from '../../services/insumos';
import { uploadService } from '../../services/upload';

const ProdutoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [produto, setProduto] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    insumos: [],
    maoDeObraHoras: 0.5, // valor padrão
    maoDeObraCustoHora: 6.9, // valor padrão
    margemLucro: 30, // valor padrão
    custosAdicionais: {
      sacoPlastico: 0.1,
      caixaSacola: 0.54,
      tag: 0.07,
      adesivoLogo: 0.25,
      brinde: 1,
      outros: 0
    },
    imagemUrl: ''
  });

  const [insumosDisponiveis, setInsumosDisponiveis] = useState([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState('');
  const [quantidadeInsumo, setQuantidadeInsumo] = useState('');
  const [unidadeInsumo, setUnidadeInsumo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagemFile, setImagemFile] = useState(null);

  const categorias = [
    'Pulseiras', 'Chaveiros', 'Bolsas', 
    'Outros'
  ];

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        
        // Carregar insumos disponíveis
        const insumosData = await insumoService.listar();
        setInsumosDisponiveis(insumosData);

        // Se está editando, carregar dados do produto
        if (isEditing) {
          const produtoData = await produtosService.buscarPorId(id);
          if (produtoData.insumosCompletos) {
            produtoData.insumos = produtoData.insumosCompletos;
            delete produtoData.insumosCompletos;
          }
          setProduto(produtoData);
        }
      } catch (err) {
        setError('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustosAdicionaisChange = (e) => {
    const { name, value } = e.target;
    setProduto(prev => ({
      ...prev,
      custosAdicionais: {
        ...prev.custosAdicionais,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  const handleImagemChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagemFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduto(prev => ({ ...prev, imagemUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const adicionarInsumo = () => {
    if (!insumoSelecionado || !quantidadeInsumo || !unidadeInsumo) {
      setError('Selecione um insumo, informe a quantidade e a unidade');
      return;
    }

    const insumo = insumosDisponiveis.find(i => i.id === parseInt(insumoSelecionado));
    const quantidade = parseFloat(quantidadeInsumo);

    // Verificar se o insumo já foi adicionado
    const jaExiste = produto.insumos.find(i => i.id === insumo.id);
    if (jaExiste) {
      setError('Este insumo já foi adicionado ao produto');
      return;
    }

    let custoTotalInsumo = 0;
    if (unidadeInsumo === insumo.unidade) {
      custoTotalInsumo = quantidade * insumo.custoUnitario;
    } else if (insumo.conversoes && insumo.conversoes[unidadeInsumo]) {
      const fatorConversao = parseFloat(insumo.conversoes[unidadeInsumo]);
      if (fatorConversao > 0) {
        custoTotalInsumo = (quantidade / fatorConversao) * insumo.custoUnitario;
      }
    }

    const novoInsumo = {
      id: insumo.id,
      nome: insumo.nome,
      quantidade: quantidade,
      unidade: unidadeInsumo,
      custoUnitario: insumo.custoUnitario,
      custoTotal: custoTotalInsumo
    };

    setProduto(prev => ({
      ...prev,
      insumos: [...prev.insumos, novoInsumo]
    }));

    setInsumoSelecionado('');
    setQuantidadeInsumo('');
    setUnidadeInsumo('');
    setError('');
  };

  const removerInsumo = (insumoId) => {
    setProduto(prev => ({
      ...prev,
      insumos: prev.insumos.filter(i => i.id !== insumoId)
    }));
  };

  const calcularCustoTotal = () => {
    const custoInsumos = produto.insumos.reduce((total, insumo) => 
      total + (insumo.custoTotal || 0), 0
    );
    const custoMaoDeObra = produto.maoDeObraHoras * produto.maoDeObraCustoHora;
    const custoAdicionalTotal = Object.values(produto.custosAdicionais || {}).reduce((total, custo) => total + custo, 0);
    return custoInsumos + custoMaoDeObra + custoAdicionalTotal;
  };

  const calcularPrecoVenda = () => {
    const custoTotal = calcularCustoTotal();
    return custoTotal * (1 + produto.margemLucro / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!produto.nome.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    if (produto.insumos.length === 0) {
      setError('Adicione pelo menos um insumo ao produto');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let finalImagemUrl = produto.imagemUrl;

      if (imagemFile) {
        const uploadData = new FormData();
        uploadData.append('imagem', imagemFile);
        try {
          const response = await uploadService.uploadImagem(uploadData);
          
          // Tentar acessar a imagemUrl de diferentes formas
          finalImagemUrl = response.data?.data?.imagemUrl || 
                          response.data?.imagemUrl || 
                          response.imagemUrl;
          
          if (!finalImagemUrl) {
            throw new Error('Não foi possível obter a URL da imagem do upload');
          }
        } catch (uploadError) {
          console.error('Falha no upload da imagem:', uploadError);
          throw new Error('Falha no upload da imagem.');
        }
      }

      const dadosProduto = {
        ...produto,
        imagemUrl: finalImagemUrl,
        custoTotal: calcularCustoTotal(),
        precoVenda: calcularPrecoVenda(),
        insumos: produto.insumos.map(i => ({ id: i.id, quantidade: i.quantidade, unidade: i.unidade }))
      };

      if (isEditing) {
        await produtosService.atualizar(id, dadosProduto);
        setSuccess('Produto atualizado com sucesso!');
      } else {
        await produtosService.criar(dadosProduto);
        setSuccess('Produto criado com sucesso!');
      }

      setTimeout(() => {
        navigate('/produtos');
      }, 1500);

    } catch (err) {
      setError('Erro ao salvar produto: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
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
              <li className="breadcrumb-item">
                <span 
                  className="text-decoration-underline" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/produtos')}
                >
                  Produtos
                </span>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </li>
            </ol>
          </nav>

          <Card className="card-soono">
            <Card.Header>
              <h4 className="mb-0 text-soono-brown">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </h4>
            </Card.Header>

            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome do Produto *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nome"
                        value={produto.nome}
                        onChange={handleInputChange}
                        placeholder="Ex: Colar Dourado Elegante"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categoria</Form.Label>
                      <Form.Select
                        name="categoria"
                        value={produto.categoria}
                        onChange={handleInputChange}
                      >
                        <option value="">Selecione...</option>
                        {categorias.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="descricao"
                    value={produto.descricao}
                    onChange={handleInputChange}
                    placeholder="Descrição detalhada do produto..."
                  />
                </Form.Group>

                {/* Adicionado campo de imagem */}
                <Form.Group className="mb-4">
                  <Form.Label>Imagem do Produto</Form.Label>
                  <Form.Control type="file" onChange={handleImagemChange} accept="image/*" />
                  {produto.imagemUrl && (
                    <div className="mt-3 text-center">
                      <img
                        src={produto.imagemUrl.startsWith('data:') || produto.imagemUrl.startsWith('blob:') ? produto.imagemUrl : `http://localhost:3001${produto.imagemUrl}`}
                        alt="Preview do Produto"
                        style={{ maxHeight: '200px', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </Form.Group>

                {/* Seção de Insumos */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Insumos Utilizados</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3 align-items-end">
                      <Col md={5}>
                        <Form.Label>Insumo</Form.Label>
                        <Form.Select
                          value={insumoSelecionado}
                          onChange={(e) => {
                            setInsumoSelecionado(e.target.value);
                            const insumo = insumosDisponiveis.find(i => i.id === parseInt(e.target.value));
                            if (insumo) {
                              setUnidadeInsumo(insumo.unidade);
                            } else {
                              setUnidadeInsumo('');
                            }
                          }}
                        >
                          <option value="">Selecionar insumo...</option>
                          {insumosDisponiveis.map(insumo => (
                            <option key={insumo.id} value={insumo.id}>
                              {insumo.nome} - {insumo.custoUnitario?.toFixed(2) || '0.00'} / {insumo.unidade}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Quantidade</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1.5"
                          value={quantidadeInsumo}
                          onChange={(e) => setQuantidadeInsumo(e.target.value)}
                          disabled={!insumoSelecionado}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label>Unidade</Form.Label>
                        <Form.Select
                          value={unidadeInsumo}
                          onChange={(e) => setUnidadeInsumo(e.target.value)}
                          disabled={!insumoSelecionado}
                        >
                          {insumoSelecionado &&
                            (() => {
                              const insumo = insumosDisponiveis.find(i => i.id === parseInt(insumoSelecionado));
                              if (!insumo) return null;
                              const unidades = [insumo.unidade];
                              if (insumo.conversoes) {
                                unidades.push(...Object.keys(insumo.conversoes));
                              }
                              return unidades.map(u => <option key={u} value={u}>{u}</option>);
                            })()}
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Button
                          variant="outline-primary"
                          onClick={adicionarInsumo}
                          disabled={!insumoSelecionado || !quantidadeInsumo}
                        >
                          Adicionar
                        </Button>
                      </Col>
                    </Row>

                    {produto.insumos.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Insumo</th>
                              <th>Quantidade</th>
                              <th>Unidade</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {produto.insumos.map(insumo => (
                              <tr key={insumo.id}>
                                <td>{insumo.nome}</td>
                                <td>{insumo.quantidade}</td>
                                <td>{insumo.unidade}</td>
                                <td>R$ {insumo.custoTotal.toFixed(2)}</td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removerInsumo(insumo.id)}
                                  >
                                    Remover
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th colSpan="3">Total Insumos:</th>
                              <th>
                                R$ {produto.insumos.reduce((total, i) => 
                                  total + i.custoTotal, 0).toFixed(2)}
                              </th>
                              <th></th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Seção de Mão de Obra */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Horas de Mão de Obra</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.5"
                        name="maoDeObraHoras"
                        value={produto.maoDeObraHoras}
                        onChange={handleInputChange}
                        placeholder="Ex: 2.5"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Valor/Hora (R$)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="maoDeObraCustoHora"
                        value={produto.maoDeObraCustoHora}
                        onChange={handleInputChange}
                        placeholder="Ex: 15.00"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Seção de Custos Adicionais */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Custos Adicionais</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Saco Plástico (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="sacoPlastico"
                            value={produto.custosAdicionais?.sacoPlastico || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Caixa/Sacola (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="caixaSacola"
                            value={produto.custosAdicionais?.caixaSacola || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tag (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="tag"
                            value={produto.custosAdicionais?.tag || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Adesivo da Logo (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="adesivoLogo"
                            value={produto.custosAdicionais?.adesivoLogo || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Brinde (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="brinde"
                            value={produto.custosAdicionais?.brinde || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Outros Custos (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="outros"
                            value={produto.custosAdicionais?.outros || 0}
                            onChange={handleCustosAdicionaisChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Margem de Lucro (%)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="margemLucro"
                        value={produto.margemLucro}
                        onChange={handleInputChange}
                        placeholder="Ex: 30"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="mt-4">
                      <Badge bg="info" className="fs-6 p-2">
                        Custo Total: R$ {calcularCustoTotal().toFixed(2)}
                      </Badge>
                      <Badge bg="success" className="fs-6 p-2 ms-2">
                        Preço Sugerido: R$ {calcularPrecoVenda().toFixed(2)}
                      </Badge>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/produtos')}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="btn-soono-primary"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')} Produto
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProdutoForm;