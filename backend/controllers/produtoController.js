/**
 * Controller para gerenciar Produtos
 * Sistema Sóonó - Macramê & Crochê
 */

const Produto = require('../models/Produto');
const Insumo = require('../models/Insumo');
const { calcularCustosProduto, simularMargens } = require('../utils/calculoLucro');
const { Op } = require('sequelize');

/**
 * GET /api/produtos - Listar todos os produtos
 */
const listarProdutos = async (req, res) => {
  try {
    const {
      categoria,
      ativo = 'true',
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

    // Filtro por busca (nome ou descrição)
    if (busca && busca.trim()) {
      filtros[Op.or] = [
        { nome: { [Op.like]: `%${busca.trim()}%` } },
        { descricao: { [Op.like]: `%${busca.trim()}%` } }
      ];
    }

    // Ordenação
    if (['nome', 'categoria', 'precoVenda', 'custoTotal'].includes(ordenar)) {
      ordem.push([ordenar, direcao.toUpperCase()]);
    } else {
      ordem.push(['nome', 'ASC']);
    }

    const produtos = await Produto.findAll({
      where: filtros,
      order: ordem
    });

    // Calcular estatísticas
    const stats = {
      total: produtos.length,
      valorTotalEstoque: produtos.reduce((total, produto) => 
        total + parseFloat(produto.custoTotal), 0
      ),
      faturamentoPotencial: produtos.reduce((total, produto) => 
        total + parseFloat(produto.precoVenda), 0
      ),
      lucroPotencial: produtos.reduce((total, produto) => 
        total + produto.getLucroPorUnidade(), 0
      )
    };

    res.json({
      success: true,
      data: produtos,
      stats,
      filtros: { categoria, ativo, busca }
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/produtos/:id - Buscar produto por ID
 */
const buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { incluir_insumos = 'true' } = req.query;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    let dadosCompletos = { ...produto.toJSON() };

    // Incluir dados completos dos insumos se solicitado
    if (incluir_insumos === 'true' && produto.insumos && produto.insumos.length > 0) {
      const idsInsumos = produto.insumos.map(item => item.id);
      const insumosCompletos = await Insumo.findAll({
        where: { id: idsInsumos }
      });

      const insumosMapeados = produto.insumos.map(insumoUtilizado => {
        const insumoCompleto = insumosCompletos.find(i => i.id === insumoUtilizado.id);
        
        // Se o insumo não for encontrado, retornar dados padrão
        if (!insumoCompleto) {
          console.warn(`Insumo ID ${insumoUtilizado.id} não encontrado para produto ${produto.nome}`);
          return {
            id: insumoUtilizado.id,
            nome: `Insumo ${insumoUtilizado.id} (não encontrado)`,
            custoUnitario: 0,
            unidade: insumoUtilizado.unidade || 'unidade',
            quantidade: parseFloat(insumoUtilizado.quantidade) || 0,
            custoTotal: 0,
            variacao: null,
            erro: 'Insumo não encontrado'
          };
        }
        
        // Processar apenas se o insumo foi encontrado
        let custoTotalInsumo = 0;
        const unidadeUtilizada = insumoUtilizado.unidade || insumoCompleto.unidade;
        const quantidade = parseFloat(insumoUtilizado.quantidade) || 0;
        const custoUnitario = parseFloat(insumoCompleto.custoUnitario) || 0;

        if (unidadeUtilizada === insumoCompleto.unidade) {
          custoTotalInsumo = quantidade * custoUnitario;
        } else if (insumoCompleto.conversoes && insumoCompleto.conversoes[unidadeUtilizada]) {
          const fatorConversao = parseFloat(insumoCompleto.conversoes[unidadeUtilizada]);
          if (fatorConversao > 0) {
            custoTotalInsumo = (quantidade / fatorConversao) * custoUnitario;
          }
        }

        return {
          id: insumoCompleto.id,
          nome: insumoCompleto.nome,
          custoUnitario: custoUnitario,
          unidade: unidadeUtilizada,
          quantidade: quantidade,
          custoTotal: custoTotalInsumo,
          variacao: insumoCompleto.variacao
        };
      });
      dadosCompletos.insumosCompletos = insumosMapeados;
    }

    res.json({
      success: true,
      data: dadosCompletos
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * POST /api/produtos - Criar novo produto
 */
const criarProduto = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      categoria = 'Geral',
      insumos = [],
      maoDeObraHoras = 0.5,
      maoDeObraCustoHora = 6.9,
      margemLucro = 30,
      custosAdicionais = {},
      imagemUrl,
      ativo = true
    } = req.body;

    // Validações básicas
    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Nome do produto é obrigatório'
      });
    }

    // Verificar se já existe produto com mesmo nome
    const produtoExistente = await Produto.findOne({
      where: { nome: nome.trim() }
    });

    if (produtoExistente) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um produto com este nome'
      });
    }

    // Validar e buscar insumos utilizados
    let insumosValidados = [];
    let insumosUtilizados = [];

    if (Array.isArray(insumos) && insumos.length > 0) {
      const idsInsumos = insumos.map(item => item.id);
      const insumosEncontrados = await Insumo.findAll({
        where: { id: idsInsumos, ativo: true }
      });

      if (insumosEncontrados.length !== idsInsumos.length) {
        return res.status(400).json({
          success: false,
          error: 'Alguns insumos não foram encontrados ou estão inativos'
        });
      }

      // Preparar dados dos insumos utilizados
      insumosValidados = insumos.map(insumoUtilizado => {
        const insumo = insumosEncontrados.find(i => i.id === insumoUtilizado.id);
        return {
          id: insumo.id,
          quantidade: parseFloat(insumoUtilizado.quantidade) || 0,
          custoUnitario: parseFloat(insumo.custoUnitario),
          unidadePrincipal: insumo.unidade,
          unidadeUtilizada: insumoUtilizado.unidade || insumo.unidade,
          conversoes: insumo.conversoes
        };
      });

      insumosUtilizados = insumos.map(item => ({
        id: item.id,
        quantidade: item.quantidade,
        unidade: item.unidade
      }));
    }

    // Calcular custos automaticamente
    const dadosCalculo = {
      insumosUtilizados: insumosValidados,
      maoDeObraHoras: parseFloat(maoDeObraHoras),
      custoPorHora: parseFloat(maoDeObraCustoHora),
      margemLucro: parseFloat(margemLucro),
      custosAdicionais: custosAdicionais
    };

    const calculos = calcularCustosProduto(dadosCalculo);

    const novoProduto = await Produto.create({
      nome: nome.trim(),
      descricao: descricao?.trim(),
      categoria: categoria.trim(),
      insumos: insumosUtilizados,
      maoDeObraHoras: parseFloat(maoDeObraHoras),
      maoDeObraCustoHora: parseFloat(maoDeObraCustoHora),
      margemLucro: parseFloat(margemLucro),
      custosAdicionais: custosAdicionais,
      custoInsumos: calculos.custoInsumos,
      custoMaoDeObra: calculos.custoMaoDeObra,
      custoTotal: calculos.custoTotal,
      precoVenda: calculos.precoVenda,
      imagemUrl,
      ativo
    });

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: novoProduto,
      calculos
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);

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
 * PUT /api/produtos/:id - Atualizar produto
 */
const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    // Se mudou nome, verificar duplicatas
    if (dadosAtualizacao.nome && dadosAtualizacao.nome !== produto.nome) {
      const duplicata = await Produto.findOne({
        where: {
          nome: dadosAtualizacao.nome.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (duplicata) {
        return res.status(409).json({
          success: false,
          error: 'Já existe outro produto com este nome'
        });
      }
    }

    // Preparar dados para atualização
    const dadosLimpos = { ...dadosAtualizacao };
    
    if (dadosLimpos.nome) dadosLimpos.nome = dadosLimpos.nome.trim();
    if (dadosLimpos.categoria) dadosLimpos.categoria = dadosLimpos.categoria.trim();
    if (dadosLimpos.descricao) dadosLimpos.descricao = dadosLimpos.descricao.trim();
    if (dadosLimpos.custosAdicionais) dadosLimpos.custosAdicionais = dadosLimpos.custosAdicionais;
    if (dadosLimpos.imagemUrl) dadosLimpos.imagemUrl = dadosLimpos.imagemUrl;

    // Se alterou insumos, validar novamente
    if (dadosAtualizacao.insumos) {
      const insumos = dadosAtualizacao.insumos;
      let insumosValidados = [];
      let insumosUtilizados = [];

      if (Array.isArray(insumos) && insumos.length > 0) {
        const idsInsumos = insumos.map(item => item.id);
        const insumosEncontrados = await Insumo.findAll({
          where: { id: idsInsumos, ativo: true }
        });

        if (insumosEncontrados.length !== idsInsumos.length) {
          return res.status(400).json({
            success: false,
            error: 'Alguns insumos não foram encontrados ou estão inativos'
          });
        }

        insumosValidados = insumos.map(insumoUtilizado => {
          const insumo = insumosEncontrados.find(i => i.id === insumoUtilizado.id);
          return {
            id: insumo.id,
            quantidade: parseFloat(insumoUtilizado.quantidade) || 0,
            custoUnitario: parseFloat(insumo.custoUnitario),
            unidadePrincipal: insumo.unidade,
            unidadeUtilizada: insumoUtilizado.unidade || insumo.unidade,
            conversoes: insumo.conversoes
          };
        });

        insumosUtilizados = insumos.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          unidade: item.unidade
        }));

        dadosLimpos.insumos = insumosUtilizados;

        // Recalcular custos se mudaram os insumos, horas ou margem
        const dadosCalculo = {
          insumosUtilizados: insumosValidados,
          maoDeObraHoras: parseFloat(dadosLimpos.maoDeObraHoras || produto.maoDeObraHoras),
          custoPorHora: parseFloat(dadosLimpos.maoDeObraCustoHora || produto.maoDeObraCustoHora),
          margemLucro: parseFloat(dadosLimpos.margemLucro || produto.margemLucro),
          custosAdicionais: dadosLimpos.custosAdicionais || produto.custosAdicionais
        };

        const calculos = calcularCustosProduto(dadosCalculo);

        dadosLimpos.custoInsumos = calculos.custoInsumos;
        dadosLimpos.custoMaoDeObra = calculos.custoMaoDeObra;
        dadosLimpos.custoTotal = calculos.custoTotal;
        dadosLimpos.precoVenda = calculos.precoVenda;
      }
    }

    // Se mudaram apenas horas, custo/hora ou margem sem alterar insumos
    if (!dadosAtualizacao.insumos && (
      dadosAtualizacao.maoDeObraHoras !== undefined ||
      dadosAtualizacao.maoDeObraCustoHora !== undefined ||
      dadosAtualizacao.margemLucro !== undefined ||
      dadosAtualizacao.custosAdicionais !== undefined
    )) {
      // Buscar insumos atuais do produto
      let insumosValidados = [];
      
      if (produto.insumos && produto.insumos.length > 0) {
        const idsInsumos = produto.insumos.map(item => item.id);
        const insumosEncontrados = await Insumo.findAll({
          where: { id: idsInsumos }
        });

        insumosValidados = produto.insumos.map(insumoUtilizado => {
          const insumo = insumosEncontrados.find(i => i.id === insumoUtilizado.id);
          return {
            id: insumo.id,
            quantidade: parseFloat(insumoUtilizado.quantidade) || 0,
            custoUnitario: parseFloat(insumo.custoUnitario)
          };
        });
      }

      const dadosCalculo = {
        insumosUtilizados: insumosValidados,
        maoDeObraHoras: parseFloat(dadosLimpos.maoDeObraHoras || produto.maoDeObraHoras),
        custoPorHora: parseFloat(dadosLimpos.maoDeObraCustoHora || produto.maoDeObraCustoHora),
        margemLucro: parseFloat(dadosLimpos.margemLucro || produto.margemLucro),
        custosAdicionais: dadosLimpos.custosAdicionais || produto.custosAdicionais
      };

      const calculos = calcularCustosProduto(dadosCalculo);

      dadosLimpos.custoInsumos = calculos.custoInsumos;
      dadosLimpos.custoMaoDeObra = calculos.custoMaoDeObra;
      dadosLimpos.custoTotal = calculos.custoTotal;
      dadosLimpos.precoVenda = calculos.precoVenda;
    }

    await produto.update(dadosLimpos);
    await produto.reload();

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: produto
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);

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
 * DELETE /api/produtos/:id - Excluir produto
 */
const excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    // TODO: Verificar se o produto foi vendido
    // Talvez apenas desativar em vez de excluir se tiver histórico de vendas

    await produto.destroy();

    res.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * POST /api/produtos/:id/simular-precos - Simular diferentes margens de lucro
 */
const simularPrecos = async (req, res) => {
  try {
    const { id } = req.params;
    const { margens = [20, 30, 40, 50, 60] } = req.body;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    const simulacoes = simularMargens(produto.custoTotal, margens);

    res.json({
      success: true,
      data: {
        produto: produto.nome,
        custoTotal: parseFloat(produto.custoTotal),
        margemAtual: parseFloat(produto.margemLucro),
        precoAtual: parseFloat(produto.precoVenda),
        simulacoes
      }
    });

  } catch (error) {
    console.error('Erro ao simular preços:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * PUT /api/produtos/:id/recalcular - Recalcular custos com preços atuais dos insumos
 */
const recalcularCustos = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    if (!produto.insumos || produto.insumos.length === 0) {
      return res.json({
        success: true,
        message: 'Produto não possui insumos para recalcular',
        data: produto
      });
    }

    // Buscar preços atuais dos insumos
    const idsInsumos = produto.insumos.map(item => item.id);
    const insumosAtuais = await Insumo.findAll({
      where: { id: idsInsumos }
    });

    const insumosValidados = produto.insumos.map(insumoUtilizado => {
      const insumoAtual = insumosAtuais.find(i => i.id === insumoUtilizado.id);
      return {
        id: insumoAtual.id,
        quantidade: parseFloat(insumoUtilizado.quantidade) || 0,
        custoUnitario: parseFloat(insumoAtual.custoUnitario)
      };
    });

    // Recalcular com preços atuais
    const dadosCalculo = {
      insumosUtilizados: insumosValidados,
      maoDeObraHoras: parseFloat(produto.maoDeObraHoras),
      custoPorHora: parseFloat(produto.maoDeObraCustoHora),
      margemLucro: parseFloat(produto.margemLucro)
    };

    const calculos = calcularCustosProduto(dadosCalculo);

    await produto.update({
      custoInsumos: calculos.custoInsumos,
      custoMaoDeObra: calculos.custoMaoDeObra,
      custoTotal: calculos.custoTotal,
      precoVenda: calculos.precoVenda
    });

    await produto.reload();

    res.json({
      success: true,
      message: 'Custos recalculados com preços atuais dos insumos',
      data: produto,
      calculos
    });

  } catch (error) {
    console.error('Erro ao recalcular custos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/produtos/categorias - Listar categorias distintas
 */
const listarCategorias = async (req, res) => {
  try {
    const categorias = await Produto.findAll({
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
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  simularPrecos,
  recalcularCustos,
  listarCategorias
};