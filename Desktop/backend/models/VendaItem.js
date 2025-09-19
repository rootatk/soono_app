const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VendaItem = sequelize.define('VendaItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  venda_cabecalho_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'venda_cabecalhos',
      key: 'id'
    }
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'produtos',
      key: 'id'
    }
  },
  produto_nome: {
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
  preco_unitario_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Preço original do produto'
  },
  margem_simulada: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Margem simulada aplicada, se houver'
  },
  preco_unitario_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Preço final após simulação de margem'
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  custo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  custo_unitario_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  custo_unitario_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  desconto_custo_aplicado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  lucro_item: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  eh_brinde: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se true, conta como 1 produto independente da quantidade'
  },
  observacoes_item: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Snapshot dos insumos para histórico
  insumos_snapshot: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot dos insumos utilizados no momento da venda'
  }
}, {
  tableName: 'venda_itens',
  timestamps: true,
  indexes: [
    {
      fields: ['venda_cabecalho_id']
    },
    {
      fields: ['produto_id']
    }
  ]
});

module.exports = VendaItem;
