module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MediaFinal",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      anoLetivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ano_letivo",
      },
      mediaFinal: { type: DataTypes.DECIMAL(5, 2), field: "media_final" },
      status: { type: DataTypes.STRING(20) },
    },
    {
      tableName: "medias_finais",
      createdAt: false,
      indexes: [
        {
          unique: true,
          fields: ["estudante_id", "disciplina_id", "ano_letivo"],
        },
      ],
    },
  );
};
