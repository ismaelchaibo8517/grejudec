const { Professor, Disciplina, sequelize, Usuario , DisciplinaProfessor} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// Adicionámos o array de IDs de disciplinas na validação do Joi
const professorSchema = Joi.object({
  nomeCompleto: Joi.string().trim().min(3).max(50).required().messages({
    "string.min": "O nome deve ter pelo menos 3 caracteres.",
    "string.max": "O nome não pode exceder 50 caracteres.",
    "any.required": "O nome completo é obrigatório."
  }),
  especialidade: Joi.string().trim().max(100).allow('', null),
  disciplinasIds: Joi.array().items(Joi.number().integer()).unique().optional().messages({
    "array.unique": "Não podes associar a mesma disciplina mais do que uma vez."
  }),
  email: Joi.string().email().optional()

});

// C:\Users\administrator\Documents\js\grejudec\backend\controllers\professorController.js

exports.criarProfessor = async (req, res, next) => {
  // Iniciamos a transação para garantir que tudo (Usuário + Professor + Disciplinas) seja criado ou nada seja feito
  const t = await sequelize.transaction();

  try {
    // 1. Validação com o Joi
    const { error, value } = professorSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    const { nomeCompleto, especialidade, disciplinasIds, email } = value;

    // 2. Gerar o Número de Matrícula (Formato: YYYY.XXX)
    const currentYear = new Date().getFullYear();
    
    // Procura o último utilizador criado este ano com este padrão de matrícula
    const ultimoUsuario = await Usuario.findOne({
      where: {
        nomeUsuario: {
          [Op.like]: `${currentYear}.%`
        }
      },
      order: [['nomeUsuario', 'DESC']], // Ordena decrescentemente para apanhar o maior número
      transaction: t
    });

    let proximoNumero = 1;
    if (ultimoUsuario) {
      // Divide "2026.002" em ["2026", "002"]
      const partes = ultimoUsuario.nomeUsuario.split('.');
      if (partes.length === 2) {
        const ultimoNumero = parseInt(partes[1], 10);
        if (!isNaN(ultimoNumero)) {
          proximoNumero = ultimoNumero + 1;
        }
      }
    }

    // Formata o número com 3 dígitos (ex: 1 -> "001")
    const matricula = `${currentYear}.${String(proximoNumero).padStart(3, '0')}`;

    // 3. Encriptar a senha padrão ("teacher123")
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash("teacher123", saltRounds);

    // 4. Criar o Usuário do Professor
    const novoUsuario = await Usuario.create(
      {
        nomeUsuario: matricula, // A matrícula será o nome de usuário para o login
        email: email || `${matricula}@grejudec.com`, // Fallback caso não venha e-mail no formulário
        senhaHash: senhaHash,
        papel: "professor",
        ativo: true
      },
      { transaction: t }
    );

    // 5. Criar o registro do Professor (agora com a matrícula guardada diretamente nele!)
    const novoProfessor = await Professor.create(
      { 
        nomeCompleto, 
        especialidade,
        usuarioProfessor: matricula, // 👈 Guarda "2026.001" direto na tabela professores
        usuarioId: novoUsuario.id     // Associa com a chave estrangeira do usuário
      },
      { transaction: t }
    );

    // 6. Associar Disciplinas (Muitos-para-Muitos) se existirem
    if (disciplinasIds && disciplinasIds.length > 0) {
      const disciplinasExistentes = await Disciplina.findAll({
        where: { id: disciplinasIds, ativo: true },
        transaction: t
      });

      if (disciplinasExistentes.length !== disciplinasIds.length) {
        const err = new Error("Uma ou mais disciplinas selecionadas são inválidas ou estão inativas.");
        err.status = 400;
        throw err;
      }

      // Associação usando o padrão snake_case definido na tabela intermédia
      if (typeof novoProfessor.setDisciplinas === "function") {
        await novoProfessor.setDisciplinas(disciplinasIds, { 
          through: { ano_letivo: currentYear }, 
          transaction: t 
        });
      } else {
        const bulkData = disciplinasIds.map(id => ({
          professor_id: novoProfessor.id,
          disciplina_id: id,
          ano_letivo: currentYear
        }));
        await DisciplinaProfessor.bulkCreate(bulkData, { transaction: t });
      }
    }

    // Confirmar todas as alterações no banco de dados
    await t.commit();

    // 7. Retornar o professor com os relacionamentos populados
    const inclusaoModelos = [
      { model: Disciplina, as: "disciplinas", where: { ativo: true }, required: false }
    ];

    if (Professor.associations.usuario) {
      inclusaoModelos.push({ model: Usuario, as: "usuario", attributes: ['id', 'nomeUsuario', 'email', 'papel'] });
    }

    const professorCompleto = await Professor.findOne({
      where: { id: novoProfessor.id },
      include: inclusaoModelos
    });

    return res.status(201).json({
      success: true,
      alert: {
        type: "success",
        message: "Professor Cadastrado",
        description: `Professor cadastrado com sucesso! Credenciais de acesso criadas.`
      },
      credenciais: {
        usuario: matricula,
        senhaProvisoria: "teacher123"
      },
      novoProfessor: professorCompleto || novoProfessor
    });

  } catch (error) {
    // Se algo falhar no meio do caminho, desfaz tudo o que foi inserido nesta tentativa
    await t.rollback();
    next(error);
  }
};

// 2. Listar Ativos (Atualizado para trazer disciplinas vinculadas)
exports.listarProfessores = async (req, res, next) => {
  try {
    const professores = await Professor.findAll({
      where: { ativo: true },
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          where: { ativo: true },
          required: false // Mantém o professor na lista mesmo se não tiver disciplinas
        }
      ]
    });
    return res.status(200).json(professores);
  } catch (error) { next(error); }
};

// 3. Obter por ID (Atualizado para trazer disciplinas vinculadas)
exports.obterProfessorPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({
      where: { id, ativo: true },
      include: [
        {
          model: Disciplina,
          as: "disciplinas",
          where: { ativo: true },
          required: false
        }
      ]
    });
    
    if (!professor) {
      const err = new Error("Professor não encontrado ou inativo.");
      err.status = 404;
      return next(err);
    }
    return res.status(200).json(professor);
  } catch (error) { next(error); }
};

// 4. Atualizar (Atualizado para gerir alterações de disciplinas)
exports.atualizarProfessor = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({ where: { id, ativo: true }, transaction: t });
    if (!professor) {
      const err = new Error("Professor não encontrado.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = professorSchema.validate(req.body);
    if (error) return next(new Error(error.details[0].message));

    const { nomeCompleto, especialidade, disciplinasIds } = value;

    // Atualiza os dados básicos
    await professor.update({ nomeCompleto, especialidade }, { transaction: t });

    // Sincroniza as disciplinas (remove as antigas e adiciona as novas)
    if (disciplinasIds) {
      if (typeof professor.setDisciplinas === "function") {
        await professor.setDisciplinas(disciplinasIds, { transaction: t });
      } else {
        // Se for 1:N - Limpa as antigas e define as novas
        await Disciplina.update({ professorId: null }, { where: { professorId: professor.id }, transaction: t });
        if (disciplinasIds.length > 0) {
          await Disciplina.update({ professorId: professor.id }, { where: { id: disciplinasIds }, transaction: t });
        }
      }
    }

    await t.commit();

    const professorAtualizado = await Professor.findOne({
      where: { id: professor.id },
      include: [{ model: Disciplina, as: "disciplinas", where: { ativo: true }, required: false }]
    });

    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Professor Atualizado",
        description: "Dados do professor e disciplinas atualizados com sucesso."
      },
      professor: professorAtualizado
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 5. Deletar (Soft Delete)
exports.deletarProfessor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({ where: { id, ativo: true } });
    if (!professor) return next(new Error("Professor não encontrado."));

    await professor.update({ ativo: false });
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Professor Removido",
        description: "Professor removido com sucesso."
      }
    });
  } catch (error) { next(error); }
};



exports.obterMinhasDisciplinas = async (req, res, next) => {
  try {
    // 1. Encontrar o professor associado ao utilizador logado
    const professor = await Professor.findOne({ 
      where: { usuario_id: req.usuario.id } // Assume que o id do auth está em req.usuario.id
    });

    console.log("DEBUG: Procurando professor para usuario_id:", req.usuario.id);

    if (!professor) {
      const err = new Error("Perfil de professor não encontrado para este utilizador. chegou a servidor");
      err.status = 404;
      return next(err);
    }

    const anoAtual = new Date().getFullYear();

    // 2. Buscar as relações na tabela DisciplinaProfessor e incluir os dados da Disciplina
    const turmasDoProfessor = await DisciplinaProfessor.findAll({
      where: { 
        professorId: professor.id,
        anoLetivo: anoAtual // Busca apenas as disciplinas do ano corrente
      },
      include: [
        { 
          model: Disciplina,
          where: { ativo: true } // Traz apenas disciplinas ativas
        }
      ]
    });

    // 3. Limpar a resposta para entregar apenas um array de disciplinas ao frontend
    // O map tira a "casca" da tabela intermédia e devolve só os dados da disciplina
    const disciplinas = turmasDoProfessor.map(relacao => relacao.Disciplina);

    return res.status(200).json(disciplinas);
  } catch (error) {
    console.error("Erro ao buscar disciplinas do professor:", error);
    next(error);
  }
};