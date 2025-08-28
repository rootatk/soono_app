// src/components/Insumos/InsumoForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados do insumo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
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
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-soono-brown">
            {isEdit ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}
          </h2>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {/* Formulário */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card card-soono">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Nome */}
                  <div className="col-md-8 mb-3">
                    <label htmlFor="nome" className="form-label">
                      Nome do Insumo *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Linha de algodão azul"
                      required
                    />
                  </div>

                  {/* Variação */}
                  <div className="col-md-4 mb-3">
                    <label htmlFor="variacao" className="form-label">
                      Variação
                    </label>
                    <select
                      className="form-select"
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
                    </select>
                  </div>
                </div>

                <div className="row">
                  {/* Categoria */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="categoria" className="form-label">
                      Categoria *
                    </label>
                    <select
                      className="form-select"
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
                    </select>
                  </div>

                  {/* Unidade de Medida */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="unidade" className="form-label">
                      Unidade de Medida *
                    </label>
                    <select
                      className="form-select"
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
                    </select>
                  </div>
                </div>

                <div className="row">
                  {/* Custo Unitário */}
                  <div className="col-md-4 mb-3">
                    <label htmlFor="custoUnitario" className="form-label">
                      Custo Unitário *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">R$</span>
                      <input
                        type="number"
                        className="form-control"
                        id="custoUnitario"
                        name="custoUnitario"
                        value={formData.custoUnitario}
                        onChange={handleInputChange}
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Quantidade em Estoque */}
                  <div className="col-md-4 mb-3">
                    <label htmlFor="estoqueAtual" className="form-label">
                      Qtd. em Estoque *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="estoqueAtual"
                      name="estoqueAtual"
                      value={formData.estoqueAtual}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Estoque Mínimo */}
                  <div className="col-md-4 mb-3">
                    <label htmlFor="estoqueMinimo" className="form-label">
                      Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="estoqueMinimo"
                      name="estoqueMinimo"
                      value={formData.estoqueMinimo}
                      onChange={handleInputChange}
                      placeholder="5"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Fornecedor */}
                <div className="mb-3">
                  <label htmlFor="fornecedor" className="form-label">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fornecedor"
                    name="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleInputChange}
                    placeholder="Nome do fornecedor ou loja"
                  />
                </div>

                {/* Observações */}
                <div className="mb-4">
                  <label htmlFor="observacoes" className="form-label">
                    Observações
                  </label>
                  <textarea
                    className="form-control"
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Informações adicionais sobre o insumo..."
                  ></textarea>
                </div>

                {/* Preview de Valores */}
                {formData.custoUnitario && formData.estoqueAtual && (
                  <div className="alert alert-info">
                    <h6 className="mb-2">
                      <i className="fas fa-calculator me-2"></i>
                      Resumo dos Valores:
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Valor Total em Estoque:</strong><br />
                        {formatarMoeda(
                          parseFloat(formData.custoUnitario || 0) * 
                          parseFloat(formData.estoqueAtual || 0)
                        )}
                      </div>
                      <div className="col-md-6">
                        <strong>Custo por {formData.unidade}:</strong><br />
                        {formatarMoeda(parseFloat(formData.custoUnitario || 0))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/insumos')}
                        disabled={loading}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="btn btn-soono-primary"
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
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsumoForm;