module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Avaliacao",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // Notas específicas como colunas (nullable: true porque o aluno pode ainda não ter feito a prova)
      teste1: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0, max: 20 },
      },
      teste2: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0, max: 20 },
      },
      teste3: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0, max: 20 },
      },
      exame: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0, max: 20 },
      },
      recorrencia: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0, max: 20 },
      },

      ano_letivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ano_letivo",
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      estudante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "estudante_id",
      },
      disciplina_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "disciplina_id",
      },
    },
    {
      tableName: "avaliacoes",
      indexes: [
        {
          // Impede que o mesmo aluno tenha duas linhas para a mesma disciplina no mesmo ano
          unique: true,
          fields: ["estudante_id", "disciplina_id", "ano_letivo"],
        },
      ],
    },
  );
};
