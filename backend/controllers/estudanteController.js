const { Estudante } = require("../models");
const { Op } = require("sequelize"); // Adiciona esta importação para o LIKE funcionar
const Joi = require("joi");

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
    .valid("ativo", "trancado", "concluido", "desistente")
    .default("ativo")
    .messages({
      "any.only": "Status inválido. Escolha entre: ativo, trancado, concluido ou desistente."
    })
});

// 1. Criar Estudante com Matrícula Automática
// 1. Criar Estudante com Matrícula Automática e Verificação de BI
exports.criarEstudante = async (req, res, next) => {
  try {
    const { error, value } = estudanteSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // --- VERIFICAÇÃO: BI já existe? ---
    const biExistente = await Estudante.findOne({ where: { numBi: value.numBi } });
    if (biExistente) {
      const err = new Error("Este número de BI já está registrado no sistema.");
      err.status = 409; // 409 Conflict
      return next(err);
    }
    // ----------------------------------

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

    value.numeroMatricula = novoNumeroMatricula;
    // --------------------------------------

    const novoEstudante = await Estudante.create(value);
    return res.status(201).json(novoEstudante);
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
    return res.status(200).json({ mensagem: "Estudante atualizado com sucesso." });
  } catch (error) { next(error); }
};
// 4. Deletar (Soft Delete)
exports.deletarEstudante = async (req, res, next) => {
  try {
    const { id } = req.params;
    const estudante = await Estudante.findOne({ where: { id, ativo: true } });
    
    if (!estudante) return next(new Error("Estudante não encontrado."));

    await estudante.update({ ativo: false });
    return res.status(200).json({ mensagem: "Estudante removido com sucesso." });
  } catch (error) { next(error); }
};