const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VendaCabecalho = sequelize.define('VendaCabecalho', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  desconto_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  desconto_valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  lucro_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  quantidade_produtos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantidade total de produtos (excluindo brindes para cálculo de desconto)'
  },
  cliente: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('rascunho', 'finalizada', 'cancelada'),
    allowNull: false,
    defaultValue: 'rascunho'
  }
}, {
  tableName: 'venda_cabecalhos',
  timestamps: true,
  indexes: [
    {
      fields: ['codigo']
    },
    {
      fields: ['data']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = VendaCabecalho;
