module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Disciplina",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: DataTypes.STRING(100), allowNull: false },
      codigo: { type: DataTypes.STRING(20), unique: true },
    },
    { tableName: "disciplinas", timestamps: false },
  );
};
