/**
 * Controller para gerenciar Insumos
 * Sistema Sóonó - Macramê & Crochê
 */

const Insumo = require('../models/Insumo');
const { Op } = require('sequelize');

/**
 * GET /api/insumos - Listar todos os insumos
 */
const listarInsumos = async (req, res) => {
  try {
    const { 
      categoria, 
      ativo = 'true', 
      estoque_baixo,
      busca,
      ordenar = 'nome',
      direcao = 'ASC'
    } = req.query;

    const filtros = {};
    const ordem = [];

    // Filtro por status ativo/inativo
    if (ativo !== 'todos') {
      filtros.ativo = ativo === 'true';
    }

    // Filtro por categoria
    if (categoria && categoria !== 'todas') {
      filtros.categoria = categoria;
    }

    // Filtro por busca (nome ou variação)
    if (busca && busca.trim()) {
      filtros[Op.or] = [
        { nome: { [Op.like]: `%${busca.trim()}%` } },
        { variacao: { [Op.like]: `%${busca.trim()}%` } }
      ];
    }

    // Ordenação
    if (['nome', 'categoria', 'custoUnitario', 'estoqueAtual'].includes(ordenar)) {
      ordem.push([ordenar, direcao.toUpperCase()]);
    } else {
      ordem.push(['nome', 'ASC']);
    }

    let insumos = await Insumo.findAll({
      where: filtros,
      order: ordem
    });

    // Filtro pós-consulta para estoque baixo
    if (estoque_baixo === 'true') {
      insumos = insumos.filter(insumo => insumo.isEstoqueBaixo());
    }

    // Calcular estatísticas
    const stats = {
      total: insumos.length,
      valorTotalEstoque: insumos.reduce((total, insumo) => 
        total + insumo.getValorTotalEstoque(), 0
      ),
      estoqueBaixo: insumos.filter(insumo => insumo.isEstoqueBaixo()).length
    };

    res.json({
      success: true,
      data: insumos,
      stats,
      filtros: { categoria, ativo, estoque_baixo, busca }
    });

  } catch (error) {
    console.error('Erro ao listar insumos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/insumos/:id - Buscar insumo por ID
 */
const buscarInsumoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const insumo = await Insumo.findByPk(id);

    if (!insumo) {
      return res.status(404).json({
        success: false,
        error: 'Insumo não encontrado'
      });
    }

    res.json({
      success: true,
      data: insumo
    });

  } catch (error) {
    console.error('Erro ao buscar insumo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * POST /api/insumos - Criar novo insumo
 */
const criarInsumo = async (req, res) => {
  try {
    const {
      nome,
      categoria = 'Geral',
      custoUnitario,
      unidade = 'unidade',
      estoqueAtual = 0,
      estoqueMinimo = 1,
      variacao,
      ativo = true
    } = req.body;

    // Validações básicas
    if (!nome || !custoUnitario) {
      return res.status(400).json({
        success: false,
        error: 'Nome e custo unitário são obrigatórios'
      });
    }

    if (parseFloat(custoUnitario) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Custo unitário deve ser maior ou igual a zero'
      });
    }

    // Verificar se já existe insumo com mesmo nome e variação
    const insumoExistente = await Insumo.findOne({
      where: {
        nome: nome.trim(),
        variacao: variacao || null
      }
    });

    if (insumoExistente) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um insumo com este nome e variação'
      });
    }

    const novoInsumo = await Insumo.create({
      nome: nome.trim(),
      categoria: categoria.trim(),
      custoUnitario: parseFloat(custoUnitario),
      unidade,
      estoqueAtual: parseFloat(estoqueAtual),
      estoqueMinimo: parseFloat(estoqueMinimo),
      variacao: variacao ? variacao.toUpperCase() : null,
      ativo
    });

    res.status(201).json({
      success: true,
      message: 'Insumo criado com sucesso',
      data: novoInsumo
    });

  } catch (error) {
    console.error('Erro ao criar insumo:', error);

    // Erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * PUT /api/insumos/:id - Atualizar insumo
 */
const atualizarInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    const insumo = await Insumo.findByPk(id);

    if (!insumo) {
      return res.status(404).json({
        success: false,
        error: 'Insumo não encontrado'
      });
    }

    // Se mudou nome ou variação, verificar duplicatas
    if (dadosAtualizacao.nome || dadosAtualizacao.variacao !== undefined) {
      const nome = dadosAtualizacao.nome || insumo.nome;
      const variacao = dadosAtualizacao.variacao !== undefined ? 
        dadosAtualizacao.variacao : insumo.variacao;

      const duplicata = await Insumo.findOne({
        where: {
          nome: nome.trim(),
          variacao: variacao || null,
          id: { [Op.ne]: id } // Excluir o próprio insumo
        }
      });

      if (duplicata) {
        return res.status(409).json({
          success: false,
          error: 'Já existe outro insumo com este nome e variação'
        });
      }
    }

    // Processar dados antes de atualizar
    const dadosLimpos = { ...dadosAtualizacao };
    
    if (dadosLimpos.nome) {
      dadosLimpos.nome = dadosLimpos.nome.trim();
    }
    
    if (dadosLimpos.categoria) {
      dadosLimpos.categoria = dadosLimpos.categoria.trim();
    }

    if (dadosLimpos.variacao) {
      dadosLimpos.variacao = dadosLimpos.variacao.toUpperCase();
    }

    if (dadosLimpos.custoUnitario) {
      dadosLimpos.custoUnitario = parseFloat(dadosLimpos.custoUnitario);
    }

    if (dadosLimpos.estoqueAtual !== undefined) {
      dadosLimpos.estoqueAtual = parseFloat(dadosLimpos.estoqueAtual);
    }

    if (dadosLimpos.estoqueMinimo !== undefined) {
      dadosLimpos.estoqueMinimo = parseFloat(dadosLimpos.estoqueMinimo);
    }

    await insumo.update(dadosLimpos);
    await insumo.reload();

    res.json({
      success: true,
      message: 'Insumo atualizado com sucesso',
      data: insumo
    });

  } catch (error) {
    console.error('Erro ao atualizar insumo:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * DELETE /api/insumos/:id - Excluir insumo
 */
const excluirInsumo = async (req, res) => {
  try {
    const { id } = req.params;

    const insumo = await Insumo.findByPk(id);

    if (!insumo) {
      return res.status(404).json({
        success: false,
        error: 'Insumo não encontrado'
      });
    }

    // TODO: Verificar se o insumo está sendo usado em algum produto
    // Isso será implementado quando tivermos a relação entre produtos e insumos

    await insumo.destroy();

    res.json({
      success: true,
      message: 'Insumo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir insumo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * PUT /api/insumos/:id/estoque - Atualizar estoque (entrada/saída)
 */
const atualizarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, quantidade, observacao } = req.body;

    if (!tipo || !quantidade) {
      return res.status(400).json({
        success: false,
        error: 'Tipo e quantidade são obrigatórios'
      });
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo deve ser "entrada" ou "saida"'
      });
    }

    const quantidadeNum = parseFloat(quantidade);
    if (quantidadeNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade deve ser maior que zero'
      });
    }

    const insumo = await Insumo.findByPk(id);

    if (!insumo) {
      return res.status(404).json({
        success: false,
        error: 'Insumo não encontrado'
      });
    }

    const estoqueAtual = parseFloat(insumo.estoqueAtual);
    let novoEstoque;

    if (tipo === 'entrada') {
      novoEstoque = estoqueAtual + quantidadeNum;
    } else {
      novoEstoque = estoqueAtual - quantidadeNum;
      
      if (novoEstoque < 0) {
        return res.status(400).json({
          success: false,
          error: 'Estoque insuficiente para saída'
        });
      }
    }

    await insumo.update({ estoqueAtual: novoEstoque });

    res.json({
      success: true,
      message: `${tipo === 'entrada' ? 'Entrada' : 'Saída'} de estoque registrada`,
      data: {
        insumo: insumo.nome,
        estoqueAnterior: estoqueAtual,
        movimento: tipo === 'entrada' ? `+${quantidadeNum}` : `-${quantidadeNum}`,
        estoqueAtual: novoEstoque,
        observacao
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/insumos/categorias - Listar categorias distintas
 */
const listarCategorias = async (req, res) => {
  try {
    const categorias = await Insumo.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      where: { ativo: true }
    });

    const listaCategorias = categorias.map(item => item.categoria).sort();

    res.json({
      success: true,
      data: listaCategorias
    });

  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

module.exports = {
  listarInsumos,
  buscarInsumoPorId,
  criarInsumo,
  atualizarInsumo,
  excluirInsumo,
  atualizarEstoque,
  listarCategorias
};