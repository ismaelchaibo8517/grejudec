// C:\Users\administrator\Documents\js\grejudec\backend\models\Professor.js
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
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false,
      },
      especialidade: { type: DataTypes.STRING(100) },
      
      // Nova coluna de segurança que guarda diretamente a matrícula (ex: "2026.001")
      usuarioProfessor: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: "usuario_professor", // Nome físico da coluna no PostgreSQL
      },
      
      // Mapeamento explícito da chave estrangeira para evitar problemas de sincronização
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "usuario_id", // Nome físico da coluna no PostgreSQL
        references: {
          model: "usuarios",
          key: "id"
        }
      }
    },
    { tableName: "professores", timestamps: false },
  );
};