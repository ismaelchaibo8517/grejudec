// C:\Users\administrator\Documents\js\grejudec\backend\models\index.js
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// 1. Configuração da Conexão
const sequelize = new Sequelize('grejudec', 'postgres', 'admin123', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

// 2. Importar Modelos
const Usuario = require('./Usuario')(sequelize, DataTypes);
const Estudante = require('./Estudante')(sequelize, DataTypes);
const Professor = require('./Professor')(sequelize, DataTypes);
const Curso = require('./Curso')(sequelize, DataTypes);
const Disciplina = require('./Disciplina')(sequelize, DataTypes);
const DisciplinaProfessor = require('./DisciplinaProfessor')(sequelize, DataTypes);
const Avaliacao = require('./Avaliacao')(sequelize, DataTypes);
const MediaFinal = require('./MediaFinal')(sequelize, DataTypes);
const Pagamento = require('./Pagamento')(sequelize, DataTypes);
const TransacaoPagamento = require('./TransacaoPagamento')(sequelize, DataTypes);
const BaseConhecimento = require('./BaseConhecimento')(sequelize, DataTypes);
const HistoricoChat = require('./HistoricoChat')(sequelize, DataTypes);
const MaterialAcademico = require('./MaterialAcademico')(sequelize, DataTypes);

// 3. Relacionamentos

// --- Usuários ---
// Adicionados aliases ('as') para permitir buscas limpas e explícitas
Usuario.hasOne(Estudante, { foreignKey: 'usuario_id', as: 'estudante' });
Estudante.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Usuario.hasOne(Professor, { foreignKey: 'usuario_id', as: 'professor' });
Professor.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' }); // 👈 Essencial para achar o usuarioProfessor!

// --- Cursos ---
Curso.hasMany(Estudante, { foreignKey: 'curso_id' });
Estudante.belongsTo(Curso, { foreignKey: 'curso_id' });

Curso.hasMany(Disciplina, { foreignKey: 'curso_id' });
Disciplina.belongsTo(Curso, { foreignKey: 'curso_id' });

// --- Professores x Disciplinas (Muitos-para-Muitos) ---
// Mudado de volta para camelCase para respeitar os atributos do JS no DisciplinaProfessor.js
Disciplina.belongsToMany(Professor, { 
  through: DisciplinaProfessor, 
  foreignKey: 'disciplinaId', 
  otherKey: 'professorId', 
  as: 'professores' 
});

Professor.belongsToMany(Disciplina, { 
  through: DisciplinaProfessor, 
  foreignKey: 'professorId', 
  otherKey: 'disciplinaId', 
  as: 'disciplinas' 
});
// --- Avaliações ---
Estudante.hasMany(Avaliacao, { foreignKey: 'estudante_id' });
Avaliacao.belongsTo(Estudante, { foreignKey: 'estudante_id' });

// --- Adiciona isto para permitir o include no DisciplinaProfessor ---
DisciplinaProfessor.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
Disciplina.hasMany(DisciplinaProfessor, { foreignKey: 'disciplinaId' });

DisciplinaProfessor.belongsTo(Professor, { foreignKey: 'professorId' });
Professor.hasMany(DisciplinaProfessor, { foreignKey: 'professorId' });


Disciplina.hasMany(Avaliacao, { foreignKey: 'disciplina_id' });
Avaliacao.belongsTo(Disciplina, { foreignKey: 'disciplina_id' });

Estudante.hasMany(MediaFinal, { foreignKey: 'estudante_id' });
MediaFinal.belongsTo(Estudante, { foreignKey: 'estudante_id' });

Disciplina.hasMany(MediaFinal, { foreignKey: 'disciplina_id' });
MediaFinal.belongsTo(Disciplina, { foreignKey: 'disciplina_id' });

// --- Financeiro ---
Estudante.hasMany(Pagamento, { foreignKey: 'estudante_id' });
Pagamento.belongsTo(Estudante, { foreignKey: 'estudante_id' });

Pagamento.hasMany(TransacaoPagamento, { foreignKey: 'pagamento_id' });
TransacaoPagamento.belongsTo(Pagamento, { foreignKey: 'pagamento_id' });

// --- Material Académico ---
Disciplina.hasMany(MaterialAcademico, { foreignKey: 'disciplina_id' });
MaterialAcademico.belongsTo(Disciplina, { foreignKey: 'disciplina_id' });

// --- Integração de Notas ---
Avaliacao.hasOne(MediaFinal, { foreignKey: 'estudante_id', sourceKey: 'estudante_id' });
MediaFinal.belongsTo(Avaliacao, { foreignKey: 'estudante_id' });

// 4. Exportar tudo
module.exports = {
  sequelize,
  Usuario, 
  Estudante, 
  Professor, 
  Curso, 
  Disciplina, 
  DisciplinaProfessor,
  Avaliacao, 
  MediaFinal, 
  Pagamento, 
  TransacaoPagamento,
  BaseConhecimento, 
  HistoricoChat, 
  MaterialAcademico
};