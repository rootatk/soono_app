const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Produto = sequelize.define('Produto', {
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
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Geral'
  },
  // JSON com os insumos utilizados: [{ id: 1, quantidade: 2 }, { id: 2, quantidade: 1 }]
  insumos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  maoDeObraHoras: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  maoDeObraCustoHora: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 15.0,
    validate: {
      min: 0
    }
  },
  margemLucro: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 30.0,
    validate: {
      min: 0,
      max: 1000 // até 1000% de margem
    }
  },
  precoVenda: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  custoInsumos: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  custoMaoDeObra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  custoTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  custosAdicionais: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      sacoPlastico: 0,
      caixaSacola: 0,
      tag: 0,
      adesivoLogo: 0,
      brinde: 0,
      outros: 0
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'produtos',
  indexes: [
    {
      fields: ['nome'],
      unique: true
    },
    {
      fields: ['categoria']
    }
  ]
});

// Método para calcular lucro por unidade
Produto.prototype.getLucroPorUnidade = function() {
  return parseFloat(this.precoVenda) - parseFloat(this.custoTotal);
};

// Método para calcular margem real (%)
Produto.prototype.getMargemReal = function() {
  if (parseFloat(this.custoTotal) === 0) return 0;
  const lucro = this.getLucroPorUnidade();
  return (lucro / parseFloat(this.custoTotal)) * 100;
};

module.exports = Produto;