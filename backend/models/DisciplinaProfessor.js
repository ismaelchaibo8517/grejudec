// C:\Users\administrator\Documents\js\grejudec\backend\models\DisciplinaProfessor.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DisciplinaProfessor",
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      professorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "professor_id", // Nome real da coluna no Postgres
        references: {
          model: "professores",
          key: "id"
        }
      },
      disciplinaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "disciplina_id", // Nome real da coluna no Postgres
        references: {
          model: "disciplinas",
          key: "id"
        }
      },
      anoLetivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: new Date().getFullYear(), // Define o ano corrente de forma segura no DB
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