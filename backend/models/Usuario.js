//C:\Users\administrator\Documents\js\grejudec\backend\models\Usuario.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nomeUsuario: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        field: "nome_usuario",
      },
      email: { type: DataTypes.STRING(100), allowNull: true },
      senhaHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "senha_hash",
      },
      papel: {
        type: DataTypes.ENUM("admin", "professor", "estudante"),
        defaultValue: "estudante",
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false,
      },
    },
    { tableName: "usuarios", updatedAt: false },
  );
};
