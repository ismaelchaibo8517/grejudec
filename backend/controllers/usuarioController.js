const { Usuario, Estudante, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const Joi = require("joi"); // Lembra-te de ter o joi instalado: npm install joi

// 1. Definimos o Schema de Validação para a Pré-Inscrição
const preInscricaoSchema = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "string.email": "Por favor, introduza um email válido.",
    "any.required": "O email é obrigatório."
  }),
  senha: Joi.string().min(6).max(255).required().messages({
    "string.min": "A senha deve ter no mínimo 6 caracteres.",
    "any.required": "A senha é obrigatória."
  }),
  nomeCompleto: Joi.string().max(150).required().messages({
    "any.required": "O nome completo é obrigatório."
  }),
  numBi: Joi.string().max(20).required().messages({
    "any.required": "O número do BI é obrigatório."
  }),
  cursoId: Joi.number().integer().positive().required().messages({
    "any.required": "O curso é obrigatório."
  }),
  classe: Joi.string().valid("7", "10", "12").required().messages({
    "any.only": "A classe selecionada deve ser 7, 10 ou 12.",
    "any.required": "A classe é obrigatória."
  }),
  telefone: Joi.string().max(16).allow("", null).optional(),
  dataNascimento: Joi.date().iso().allow("", null).optional().messages({
    "date.format": "A data de nascimento deve estar no formato YYYY-MM-DD."
  })
});

// 2. CREATE / REGISTAR (Focado na Pré-Inscrição de Estudantes)
exports.criarUsuario = async (req, res, next) => {
  
  // 1. Validar os dados de entrada usando o Joi
  const { error, value } = preInscricaoSchema.validate(req.body, { abortEarly: false });

  if (error) {
    // Recolhe todas as mensagens de erro geradas pelo Joi
    const errosDetalhados = error.details.map(err => err.message);
    return res.status(400).json({ 
      mensagem: "Erro de validação nos dados enviados.", 
      erros: errosDetalhados 
    });
  }

  // Se passou no Joi, "value" contém os dados limpos e validados
  const { 
    email, senha, 
    nomeCompleto, numBi, cursoId, classe, telefone, dataNascimento 
  } = value;

  // 2. Agora sim, iniciamos a transação de forma segura
  const t = await sequelize.transaction(); 
  
  try {
    // 3. Gerar o Número de Matrícula automaticamente
    const anoAtual = new Date().getFullYear(); 
    
    // Contamos os estudantes para gerar a sequência (ex: 2026EST0001)
    const totalEstudantes = await Estudante.count({ transaction: t });
    const proximoNumero = String(totalEstudantes + 1).padStart(4, "0"); 
    
    const numeroMatriculaGenerated = `${anoAtual}EST${proximoNumero}`; 
    const usernameFinal = numeroMatriculaGenerated; // Matrícula será o nome de usuário

    // 4. Encriptar a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // 5. Criar o Usuário na tabela 'usuarios'
    const novoUsuario = await Usuario.create({
      nomeUsuario: usernameFinal,
      email,
      senhaHash,
      papel: "estudante" 
    }, { transaction: t });

    // 6. Criar o Estudante na tabela 'estudantes'
    const novoEstudante = await Estudante.create({
      numeroMatricula: numeroMatriculaGenerated,
      nomeCompleto,
      numBi,
      curso_id: cursoId,
      classe,
      telefone,
      dataNascimento,
      ativo: true,
      statusMatricula: "pre-inscritos"
    }, { transaction: t });

    // Confirma as alterações na BD se tudo correu sem sobressaltos!
    await t.commit();

    return res.status(201).json({
      mensagem: "Pré-inscrição realizada com sucesso!",
      usuario: {
        id: novoUsuario.id,
        nomeUsuario: novoUsuario.nomeUsuario,
        email: novoUsuario.email,
        papel: novoUsuario.papel
      },
      estudante: {
        id: novoEstudante.id,
        numeroMatricula: novoEstudante.numeroMatricula,
        nomeCompleto: novoEstudante.nomeCompleto,
        numBi: novoEstudante.numBi,
        classe: novoEstudante.classe,
        telefone: novoEstudante.telefone
      }
    });

  } catch (err) {
    await t.rollback(); // Se falhar na BD (ex: email duplicado), cancela tudo
    next(err);
  }
};

// GET Público para obter os dados de confirmação após a pré-inscrição
exports.obterConfirmacaoPreInscricao = async (req, res, next) => {
  try {
    const { matricula } = req.params;

    // 1. Procurar o estudante pelo número de matrícula gerado
    const estudante = await Estudante.findOne({
      where: { numeroMatricula: matricula }
    });

    if (!estudante) {
      return res.status(404).json({ mensagem: "Pré-inscrição não encontrada." });
    }

    // 2. Procurar o usuário correspondente para trazer o email
    const usuario = await Usuario.findOne({
      where: { nomeUsuario: matricula },
      attributes: ["email"] // Apenas o email, nunca a senhaHash!
    });

    // 3. Retornar apenas os dados seguros para o "recibo" no frontend
    return res.status(200).json({
      nomeCompleto: estudante.nomeCompleto,
      numeroMatricula: estudante.numeroMatricula, // Este será o "nomeUsuario" dele para o login
      email: usuario ? usuario.email : null,
      classe: estudante.classe,
      statusMatricula: estudante.statusMatricula,
      dataInscricao: estudante.createdAt
    });

  } catch (error) {
    next(error);
  }
};