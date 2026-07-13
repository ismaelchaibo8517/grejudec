module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TransacaoPagamento",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      referenciaTransacao: {
        type: DataTypes.STRING(100),
        field: "referencia_transacao",
      },
      metodo: { type: DataTypes.STRING(20), allowNull: false },
      status: { type: DataTypes.STRING(20) },
      payloadWebhookBruto: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: "payload_webhook_bruto",
      },
      processadoEm: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "processado_em",
      },
    },
    { tableName: "transacoes_pagamento", timestamps: false },
  );
};
