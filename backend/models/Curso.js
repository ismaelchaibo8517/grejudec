module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Curso",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: DataTypes.STRING(100), allowNull: false },
      codigo: { type: DataTypes.STRING(10), unique: true },
      duracao: {
        type: DataTypes.ENUM("meses_3", "meses_6"),
        defaultValue: "meses_3",

      },
      // Nova coluna de segurança
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false
      },
    },
    { tableName: "cursos", timestamps: false },
  );
};