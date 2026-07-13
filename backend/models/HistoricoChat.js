module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "HistoricoChat",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      sessaoId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "sessao_id",
      },
      pergunta: { type: DataTypes.TEXT, allowNull: false },
      resposta: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: "historico_chat", updatedAt: false },
  );
};
