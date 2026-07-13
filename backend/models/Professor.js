module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Professor",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nomeCompleto: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: "nome_completo",
      },
      especialidade: { type: DataTypes.STRING(100) },
    },
    { tableName: "professores", timestamps: false },
  );
};
