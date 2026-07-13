module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Avaliacao",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tipo: {
        type: DataTypes.ENUM("teste", "exame", "recorrencia", "trabalho"),
        allowNull: false,
      },
      nota: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: { min: 0, max: 100 }, // Regra das notas em percentagem garantida no banco
      },
      peso: { type: DataTypes.DECIMAL(4, 2), defaultValue: 1.0 },
      anoLetivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ano_letivo",
      },
            // Nova coluna de segurança
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false
      },
      dataAvaliacao: { type: DataTypes.DATEONLY, field: "data_avaliacao" },
    },
    
    {
      tableName: "avaliacoes",
      indexes: [
        {
          unique: true,
          fields: ["estudante_id", "disciplina_id", "tipo", "ano_letivo"],
        },
      ],
    },
  );
};
