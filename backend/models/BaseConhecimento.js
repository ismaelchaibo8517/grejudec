module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "BaseConhecimento",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      topico: { type: DataTypes.STRING(100), allowNull: false },
      pergunta: { type: DataTypes.TEXT, allowNull: false },
      resposta: { type: DataTypes.TEXT, allowNull: false },
      vetorEmbedding: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "vetor_embedding",
      },
      ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: "base_conhecimento", createdAt: false },
  );
};
