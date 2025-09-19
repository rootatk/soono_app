const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Venda = sequelize.define('Venda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'produtos',
      key: 'id'
    }
  },
  produtoNome: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome do produto no momento da venda (histórico)'
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  precoUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  custoTotalProduto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Custo total do produto no momento da venda'
  },
  lucroReal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Lucro real obtido na venda'
  },
  dataVenda: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cliente: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do cliente (opcional)'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // JSON com snapshot dos insumos utilizados no momento da venda
  insumosUtilizados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot dos insumos utilizados para histórico'
  }
}, {
  tableName: 'vendas',
  indexes: [
    {
      fields: ['produtoId']
    },
    {
      fields: ['dataVenda']
    },
    {
      fields: ['cliente']
    }
  ]
});

// Método para calcular margem de lucro real (%)
Venda.prototype.getMargemLucroReal = function() {
  if (parseFloat(this.custoTotalProduto) === 0) return 0;
  return (parseFloat(this.lucroReal) / parseFloat(this.custoTotalProduto)) * 100;
};

module.exports = Venda;