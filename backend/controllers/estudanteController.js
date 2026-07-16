const { Estudante ,  Curso , Disciplina} = require("../models");
const { Op } = require("sequelize"); // Adiciona esta importação para o LIKE funcionar
const Joi = require("joi");


const estudanteSchema = Joi.object({
  nomeCompleto: Joi.string()
    .trim() // Remove espaços acidentais nas pontas
    .min(3)
    .max(150)
    .required()
    .messages({
      "string.min": "O nome completo deve ter pelo menos 3 caracteres.",
      "string.max": "O nome é muito longo.",
      "any.required": "O nome completo é obrigatório."
    }),

  numBi: Joi.string()
    .trim()
    .uppercase() // Garante que a letra do BI seja sempre maiúscula (ex: 123A)
    .pattern(/^[0-9]{12}[A-Za-z]$/)
    .required()
    .messages({
      "string.pattern.base": "O BI deve conter 12 dígitos seguidos de uma letra (ex: 123456789012A).",
      "any.required": "O número do BI é obrigatório."
    }),

  telefone: Joi.string()
    .trim()
    .allow('', null),

  dataNascimento: Joi.date()
    .iso()
    .allow(null)
    .messages({
      "date.format": "Data de nascimento inválida. Use o formato AAAA-MM-DD."
    }),

  matriculaDoc: Joi.string()
    .trim()
    .allow('', null),

  certificado: Joi.string()
    .trim()
    .allow('', null),

  statusMatricula: Joi.string()
    .valid("pre-inscrito", "trancado", "concluido", "desistente")
    .default("ativo")
    .messages({
      "any.only": "Status inválido. Escolha entre: ativo, trancado, concluido ou desistente."
    }),
    cursoId: Joi.number().integer().positive().required().messages({
    "number.base": "O ID do curso deve ser um número.",
    "any.required": "O estudante precisa de estar matriculado num curso."
  })
});

// 1. Criar Estudante com Matrícula Automática e Verificação de BI e Curso
exports.criarEstudante = async (req, res, next) => {
  try {
    const { error, value } = estudanteSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // --- VERIFICAÇÃO 1: BI já existe? ---
    const biExistente = await Estudante.findOne({ where: { numBi: value.numBi } });
    if (biExistente) {
      const err = new Error("Este número de BI já está registrado no sistema.");
      err.status = 409; 
      return next(err);
    }

    // --- VERIFICAÇÃO 2: O Curso existe? ---
    const curso = await Curso.findOne({ where: { id: value.cursoId, ativo: true } });
    if (!curso) {
      const err = new Error("Curso não encontrado ou inativo. Selecione um curso válido.");
      err.status = 404;
      return next(err);
    }

    // --- Lógica de Matrícula Automática ---
    const ano = new Date().getFullYear();
    const ultimoEstudante = await Estudante.findOne({
      where: { numeroMatricula: { [Op.like]: `${ano}.%` } },
      order: [['numeroMatricula', 'DESC']]
    });

    let novoNumeroMatricula;
    if (ultimoEstudante) {
      const partes = ultimoEstudante.numeroMatricula.split('.');
      const sequencia = parseInt(partes[1], 10) + 1;
      novoNumeroMatricula = `${ano}.${sequencia.toString().padStart(3, '0')}`;
    } else {
      novoNumeroMatricula = `${ano}.001`;
    }

    // --- Montagem do Objeto Final ---
    // Mapeamos o valor do 'cursoId' recebido para 'curso_id' (nome da coluna no banco)
    const dadosParaSalvar = {
      ...value,
      numeroMatricula: novoNumeroMatricula,
      curso_id: value.cursoId , ativo: true
    };

    const novoEstudante = await Estudante.create(dadosParaSalvar);
    
    return res.status(201).json({
      success: true,
      alert: {
        type: "success",
        message: "Estudante Registrado",
        description: "Estudante matriculado e registrado com sucesso."
      },
      novoEstudante
    });
  } catch (error) { next(error); }
};

// 2. Listar Ativos
exports.listarEstudantes = async (req, res, next) => {
  try {
    const estudantes = await Estudante.findAll({ where: { ativo: true } });
    return res.status(200).json(estudantes);
  } catch (error) { next(error); }
};

// 2.1. Buscar Estudante por ID
exports.obterEstudantePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Busca apenas se estiver ativo
    const estudante = await Estudante.findOne({ 
      where: { id, ativo: true } 
    });

    if (!estudante) {
      const err = new Error("Estudante não encontrado ou inativo.");
      err.status = 404;
      return next(err);
    }

    return res.status(200).json(estudante);
  } catch (error) {
    next(error);
  }
};

// 3. Atualizar (Com Verificação de BI para não colidir com outros)
exports.atualizarEstudante = async (req, res, next) => {
  try {
    const { id } = req.params;
    const estudante = await Estudante.findOne({ where: { id, ativo: true } });
    
    if (!estudante) return next(new Error("Estudante não encontrado ou inativo."));

    const { error, value } = estudanteSchema.validate(req.body, { abortEarly: false });
    if (error) return next(new Error(error.details[0].message));

    // --- VERIFICAÇÃO: Se mudar o BI, verifique se não pertence a outro estudante ---
    if (value.numBi && value.numBi !== estudante.numBi) {
      const biOcupado = await Estudante.findOne({ where: { numBi: value.numBi } });
      if (biOcupado) {
        const err = new Error("Este número de BI já está sendo usado por outro estudante.");
        err.status = 409;
        return next(err);
      }
    }
    // -----------------------------------------------------------------------------

    await estudante.update(value);
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Estudante Atualizado",
        description: "Dados do estudante atualizados com sucesso."
      },
      estudante
    });
  } catch (error) { next(error); }
};

// 4. Deletar (Soft Delete)
exports.deletarEstudante = async (req, res, next) => {
  try {
    const { id } = req.params;
    const estudante = await Estudante.findOne({ where: { id, ativo: true } });
    
    if (!estudante) return next(new Error("Estudante não encontrado."));

    await estudante.update({ ativo: false });
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Estudante Removido",
        description: "Estudante removido com sucesso."
      }
    });
  } catch (error) { next(error); }
};


exports.listarEstudantes = async (req, res, next) => {
  try {
    const { disciplinaId } = req.query;
    let whereClause = { ativo: true };

    // Se o frontend enviar o disciplinaId, filtramos pelo curso correspondente
    if (disciplinaId) {
      const disciplina = await Disciplina.findOne({ 
        where: { id: disciplinaId, ativo: true } 
      });

      if (!disciplina) {
        const err = new Error("Disciplina não encontrada.");
        err.status = 404;
        return next(err);
      }

      // Adiciona o filtro do curso à busca de estudantes
      // (Assume que Estudante tem uma coluna curso_id ou similar)
      if (disciplina.curso_id) {
        whereClause.curso_id = disciplina.curso_id;
      }
    }

    // Busca todos os estudantes que correspondem aos critérios
    const estudantes = await Estudante.findAll({
      where: whereClause,
      attributes: ['id', 'nomeCompleto', 'numeroMatricula', 'curso_id'], // Retorna apenas o necessário
      order: [['nomeCompleto', 'ASC']] // Ordena por ordem alfabética para facilitar a pauta
    });

    return res.status(200).json(estudantes);
  } catch (error) {
    console.error("Erro ao listar estudantes:", error);
    next(error);
  }
};