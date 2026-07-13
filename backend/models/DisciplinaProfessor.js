module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DisciplinaProfessor",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      anoLetivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ano_letivo",
      },
    },
    {
      tableName: "disciplinas_professores",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["disciplina_id", "professor_id", "ano_letivo"],
        },
      ],
    },
  );
};
