module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Estudante",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      numeroMatricula: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
        field: "numero_matricula",
      },
      nomeCompleto: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: "nome_completo",
      },
      numBi: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
        field: "num_bi",
      }, // BI: Número + Letra
      telefone: { type: DataTypes.STRING(16) },
      dataNascimento: { type: DataTypes.DATEONLY, field: "data_nascimento" },
      matriculaDoc: { type: DataTypes.STRING(150), field: "matricula_doc" },
      certificado: { type: DataTypes.STRING(150) },
      ativo: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
      statusMatricula: {
        type: DataTypes.ENUM("ativo", "trancado", "concluido", "desistente"),
        defaultValue: "ativo",
        field: "status_matricula",
      },
    },
    { tableName: "estudantes", timestamps: true }, // Mudei para true, pois é melhor ter createdAt para histórico
  );
};
