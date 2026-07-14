module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Disciplina",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: DataTypes.STRING(100), allowNull: false },
      // Nova Chave Estrangeira
      cursoId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'curso_id' // Garante que o Sequelize ligue ao nome correto no banco
      },

      codigo: { type: DataTypes.STRING(20), unique: true },
      ativo: { // Adicionando para manter o padrão de segurança
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
    },
    { tableName: "disciplinas", timestamps: false },
  );
};