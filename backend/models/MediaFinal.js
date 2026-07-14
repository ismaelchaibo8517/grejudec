module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MediaFinal",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      
      // Chaves Estrangeiras (faltava na tua definição original)
      estudante_id: { type: DataTypes.INTEGER, allowNull: false },
      disciplina_id: { type: DataTypes.INTEGER, allowNull: false },
      
      ano_letivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ano_letivo",
      },
      
      // Nova coluna: Média dos 3 testes
      mediaFrequencia: { 
        type: DataTypes.DECIMAL(5, 2), 
        field: "media_frequencia" 
      },
      
      // Média Final (Média da Frequência + Exame / 2)
      mediaFinal: { 
        type: DataTypes.DECIMAL(5, 2), 
        field: "media_final" 
      },
      
      // Situação do aluno: Admitido, Excluído, Aprovado, Reprovado
      status: { 
        type: DataTypes.STRING(20) 
      },
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
    }
  );
};