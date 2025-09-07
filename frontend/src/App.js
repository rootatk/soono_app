import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Componentes principais
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

// Componentes de Insumos
import InsumoForm from './components/Insumos/InsumoForm';
import InsumoList from './components/Insumos/InsumoList';
import InsumoDetalhe from './components/Insumos/InsumoDetalhe';

// Componentes de Produtos
import ProdutoForm from './components/Produtos/ProdutoForm';
import ProdutoList from './components/Produtos/ProdutoList';
import ProdutoDetalhe from './components/Produtos/ProdutoDetalhe';

// Componentes de Vendas
import VendaList from './components/Vendas/VendaList';
import VendaForm from './components/Vendas/VendaForm';
import VendaDetalhe from './components/Vendas/VendaDetalhe';
import PriceSimulator from './components/Vendas/PriceSimulator';

// Adicione esta importação temporária no App.js
import DebugInsumos from './components/Insumos/DebugInsumos';


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/debug-insumos" element={<DebugInsumos />} />
            {/* Rota principal */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Rotas de Insumos - ORDEM IMPORTANTE! */}
            <Route path="/insumos/novo" element={<InsumoForm />} />
            <Route path="/insumos/:id/editar" element={<InsumoForm />} />
            <Route path="/insumos/:id" element={<InsumoDetalhe />} />
            <Route path="/insumos" element={<InsumoList />} />
            
            {/* Rotas futuras - Produtos */}
            <Route path="/produtos/novo" element={<ProdutoForm />} />
            <Route path="/produtos/:id/editar" element={<ProdutoForm />} />
            <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
            <Route path="/produtos" element={<ProdutoList />} />
            
            {/* Rotas de Vendas */}
            <Route path="/vendas/nova" element={<VendaForm />} />
            <Route path="/vendas/:id/editar" element={<VendaForm />} />
            <Route path="/vendas/:id" element={<VendaDetalhe />} />
            <Route path="/vendas" element={<VendaList />} />
            
            {/* Calculadora de Preços */}
            <Route path="/calculadora" element={<PriceSimulator />} />
            
            {/* Rotas futuras - Relatórios */}
            <Route path="/relatorios" element={
              <div className="container mt-4">
                <div className="alert alert-info">
                  <h4>Relatórios</h4>
                  <p>Módulo em desenvolvimento (Fase 4D)</p>
                </div>
              </div>
            } />
            
            {/* Configurações */}
            <Route path="/configuracoes" element={
              <div className="container mt-4">
                <div className="alert alert-info">
                  <h4>Configurações</h4>
                  <p>Módulo em desenvolvimento</p>
                </div>
              </div>
            } />
            
            {/* Rota 404 */}
            <Route path="*" element={
              <div className="container mt-4">
                <div className="alert alert-danger">
                  <h4>Página não encontrada</h4>
                  <p>A página que você está procurando não existe.</p>
                  <a href="/" className="btn btn-primary">Voltar ao Dashboard</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;