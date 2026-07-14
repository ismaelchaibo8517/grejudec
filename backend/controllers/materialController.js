const { MaterialAcademico, Disciplina } = require("../models");
const Joi = require("joi");

const materialSchema = Joi.object({
  titulo: Joi.string().min(3).max(150).required(),
  descricao: Joi.string().allow('', null),
  arquivoUrl: Joi.string().required(),
  disciplinaId: Joi.number().integer().required(),
});

// 1. Criar Material (Docente)
exports.criarMaterial = async (req, res, next) => {
  try {
    const { error, value } = materialSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // SEGURANÇA: Verificar se a disciplina pai existe E está ativa
    const disciplina = await Disciplina.findOne({ 
      where: { id: value.disciplinaId, ativo: true } 
    });
    
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada ou está inativa.");
      err.status = 404;
      return next(err);
    }

    const novoMaterial = await MaterialAcademico.create(value);
    return res.status(201).json(novoMaterial);
  } catch (error) {
    return next(error);
  }
};

// 2. Listar Materiais de uma Disciplina (Aluno e Docente)
// Nota: O filtro "ativo: true" já garante a segurança aqui
exports.listarPorDisciplina = async (req, res, next) => {
  try {
    const { disciplinaId } = req.params;
    
    // Verificamos se a disciplina existe e está ativa antes de buscar os materiais
    const disciplina = await Disciplina.findOne({ where: { id: disciplinaId, ativo: true } });
    if (!disciplina) {
        const err = new Error("Disciplina não encontrada ou inativa.");
        err.status = 404;
        return next(err);
    }

    const materiais = await MaterialAcademico.findAll({
      where: { disciplinaId, ativo: true },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(materiais);
  } catch (error) {
    return next(error);
  }
};

// 3. Atualizar Material (Docente)
exports.atualizarMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Buscar material apenas se ele estiver ativo
    const material = await MaterialAcademico.findOne({ where: { id, ativo: true } });
    if (!material) {
      const err = new Error("Material não encontrado ou inativo.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = materialSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    // Se estiver a alterar a disciplinaId, validar a nova disciplina
    if (value.disciplinaId && value.disciplinaId !== material.disciplinaId) {
        const novaDisciplina = await Disciplina.findOne({ where: { id: value.disciplinaId, ativo: true } });
        if (!novaDisciplina) {
            const err = new Error("Nova disciplina informada não encontrada ou inativa.");
            err.status = 404;
            return next(err);
        }
    }

    await material.update(value);
    return res.status(200).json({ mensagem: "Material atualizado." });
  } catch (error) {
    return next(error);
  }
};

// 4. Deletar (Soft Delete)
exports.deletarMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Só deletamos o que está ativo
    const material = await MaterialAcademico.findOne({ where: { id, ativo: true } });
    if (!material) {
      const err = new Error("Material não encontrado ou já removido.");
      err.status = 404;
      return next(err);
    }

    await material.update({ ativo: false });
    return res.status(200).json({ mensagem: "Material removido." });
  } catch (error) {
    return next(error);
  }
};