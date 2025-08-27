// src/components/Insumos/DebugInsumos.js
import React, { useState } from 'react';
import { insumoService } from '../../services/insumos';

const DebugInsumos = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testarAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('=== INICIANDO TESTE DA API ===');
      
      const result = await insumoService.listar();
      
      console.log('=== RESULTADO COMPLETO ===');
      console.log('Tipo da resposta:', typeof result);
      console.log('Resposta completa:', result);
      
      if (result && result.data) {
        console.log('=== DADOS DENTRO DE response.data ===');
        console.log('Tipo:', typeof result.data);
        console.log('É array?', Array.isArray(result.data));
        console.log('Dados:', result.data);
      }
      
      setResponse(result);
    } catch (err) {
      console.error('=== ERRO CAPTURADO ===');
      console.error('Erro:', err);
      console.error('Response:', err.response);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const testarCadastro = async () => {
    setLoading(true);
    setError(null);

    try {
      const novoInsumo = {
        nome: 'Teste API - ' + new Date().getTime(),
        categoria: 'Teste',
        custoUnitario: 5.50,
        estoqueAtual: 10,
        estoqueMinimo: 2,
        unidade: 'unidade'
      };

      console.log('=== TESTANDO CADASTRO ===');
      console.log('Dados a enviar:', novoInsumo);

      const result = await insumoService.criar(novoInsumo);
      
      console.log('=== CADASTRO REALIZADO ===');
      console.log('Resultado:', result);
      
      alert('Cadastro realizado com sucesso! Verifique o console.');
      
    } catch (err) {
      console.error('=== ERRO NO CADASTRO ===');
      console.error('Erro:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5>🔧 Debug - Teste da API de Insumos</h5>
          <small className="text-muted">
            Componente temporário para testar a conexão com a API
          </small>
        </div>
        <div className="card-body">
          <div className="d-flex gap-3 mb-4">
            <button 
              className="btn btn-primary"
              onClick={testarAPI}
              disabled={loading}
            >
              {loading ? 'Testando...' : '🔍 Testar Listagem'}
            </button>
            
            <button 
              className="btn btn-success"
              onClick={testarCadastro}
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : '➕ Testar Cadastro'}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <h6>❌ Erro capturado:</h6>
              <pre>{JSON.stringify(error, null, 2)}</pre>
              
              {error.response && (
                <>
                  <hr />
                  <h6>Response do servidor:</h6>
                  <p><strong>Status:</strong> {error.response.status}</p>
                  <p><strong>Data:</strong></p>
                  <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
                </>
              )}
            </div>
          )}

          {response && (
            <div className="alert alert-success">
              <h6>✅ Resposta recebida:</h6>
              
              <div className="row">
                <div className="col-md-6">
                  <h6>Informações Básicas:</h6>
                  <ul>
                    <li><strong>Tipo da resposta:</strong> {typeof response}</li>
                    <li><strong>Tem propriedade 'data':</strong> {response.data ? 'Sim' : 'Não'}</li>
                    {response.data && (
                      <>
                        <li><strong>Tipo de response.data:</strong> {typeof response.data}</li>
                        <li><strong>É array:</strong> {Array.isArray(response.data) ? 'Sim' : 'Não'}</li>
                        {Array.isArray(response.data) && (
                          <li><strong>Quantidade de itens:</strong> {response.data.length}</li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Estrutura JSON:</h6>
                  <pre style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.8em' }}>
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>

              {response.data && Array.isArray(response.data) && response.data.length > 0 && (
                <>
                  <hr />
                  <h6>Primeiro item da lista:</h6>
                  <pre>{JSON.stringify(response.data[0], null, 2)}</pre>
                </>
              )}
            </div>
          )}

          <div className="alert alert-info">
            <h6>📋 Instruções:</h6>
            <ol>
              <li>Abra o <strong>Console do navegador</strong> (F12)</li>
              <li>Clique em "Testar Listagem" para verificar a API</li>
              <li>Analise os logs detalhados que aparecem no console</li>
              <li>Se der erro 404, verifique se o backend está rodando</li>
              <li>Se os dados chegarem em formato diferente, ajustaremos o código</li>
            </ol>
          </div>

          <div className="alert alert-warning">
            <h6>⚠️ Possíveis Problemas:</h6>
            <ul className="mb-0">
              <li><strong>Erro 404:</strong> Backend não está rodando ou URL está errada</li>
              <li><strong>CORS Error:</strong> Problema de configuração do servidor</li>
              <li><strong>Dados em formato diferente:</strong> API retorna em estrutura diferente da esperada</li>
              <li><strong>Array vazio:</strong> Nenhum insumo cadastrado no banco</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugInsumos;