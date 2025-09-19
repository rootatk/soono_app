const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Insumo = sequelize.define('Insumo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Geral'
  },
  custoUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unidade: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unidade'
  },
  conversoes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Fatores de conversão para outras unidades. Ex: { "gramas": 500, "metros": 100 }'
  },
  estoqueAtual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  estoqueMinimo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  variacao: {
    type: DataTypes.STRING(1),
    allowNull: true,
    validate: {
      isAlpha: true,
      len: [1, 1]
    },
    comment: 'Para variações A-Z (útil para contas de bijuteria)'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fornecedor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagemUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'insumos',
  indexes: [
    {
      fields: ['nome', 'variacao'],
      unique: true
    },
    {
      fields: ['categoria']
    }
  ]
});

// Método para verificar se está em estoque baixo
Insumo.prototype.isEstoqueBaixo = function() {
  return this.estoqueAtual <= this.estoqueMinimo;
};

// Método para calcular valor total em estoque
Insumo.prototype.getValorTotalEstoque = function() {
  return parseFloat(this.estoqueAtual) * parseFloat(this.custoUnitario);
};

module.exports = Insumo;