module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MaterialAcademico",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: DataTypes.STRING(150), allowNull: false },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      arquivoUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "arquivo_url", // Onde o arquivo está guardado
      },
      disciplinaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "disciplina_id", // Ligação com a Disciplina
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    { tableName: "materiais_academicos", timestamps: true }, // 'true' cria automaticamente createdAt e updatedAt
  );
};
