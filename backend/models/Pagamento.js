//C:\Users\administrator\Documents\js\grejudec\backend\models\Pagamento.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Pagamento",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      estudanteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "estudante_id",
      },
      tipoServico: {
        type: DataTypes.ENUM("matricula", "certificado", "propina"),
        allowNull: false,
        field: "tipo_servico",
      },
      valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      referencia: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      status: { type: DataTypes.STRING(20), allowNull: false },
      mesReferencia: { type: DataTypes.STRING(10), field: "mes_referencia" },
      anoReferencia: { type: DataTypes.INTEGER, field: "ano_referencia" },
      descricao: { type: DataTypes.TEXT },
      urlCheckout: { type: DataTypes.STRING(255), field: "url_checkout" },
      expiraEm: { type: DataTypes.DATE, field: "expira_em" },
      // Nova coluna de segurança
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Começa como 'visível' para todos
        allowNull: false,
      },
    },
    { tableName: "pagamentos", updatedAt: false },
  );
};
