module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Professor",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nomeCompleto: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "nome_completo",
      },
            // Nova coluna de segurança
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false
      },
      especialidade: { type: DataTypes.STRING(100) },
    },
    { tableName: "professores", timestamps: false },
  );
};
