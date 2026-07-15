const { Usuario, Estudante, sequelize , Curso } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Joi = require("joi"); // Lembra-te de ter o joi instalado: npm install joi

// 1. Definimos o Schema de Validação para a Pré-Inscrição
const preInscricaoSchema = Joi.object({
  email: Joi.string().email().max(100).messages({
    "string.email": "Por favor, introduza um email válido.",
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
    // --- VERIFICAÇÃO 1: O Curso existe? ---
    const curso = await Curso.findOne({ 
      where: { id: cursoId, ativo: true }, 
      transaction: t 
    });
    
    if (!curso) {
      await t.rollback();
      return res.status(404).json({
        mensagem: "Registo recusado.",
        erros: ["O curso selecionado não foi encontrado ou está inativo. Selecione um curso válido."]
      });
    }

    // --- VERIFICAÇÃO 2: O BI já está registado? ---
    const biExistente = await Estudante.findOne({ 
      where: { numBi }, 
      transaction: t 
    });
    
    if (biExistente) {
      await t.rollback();
      return res.status(400).json({
        mensagem: "Registo recusado.",
        erros: ["Já existe um estudante cadastrado com este número de BI."]
      });
    }

    // --- VERIFICAÇÃO 3: O E-mail já está registado? (Previne o erro no Usuario.create) ---
    const emailExistente = await Usuario.findOne({ 
      where: { email }, 
      transaction: t 
    });
    
    // if (emailExistente) {
    //   await t.rollback();
    //   return res.status(400).json({
    //     mensagem: "Registo recusado.",
    //     erros: ["Este endereço de e-mail já está associado a outra conta."]
    //   });
    // }

    // --- Lógica de Matrícula Automática ---
    const ano = new Date().getFullYear();
    const ultimoEstudante = await Estudante.findOne({
      where: { numeroMatricula: { [Op.like]: `${ano}.%` } },
      order: [['numeroMatricula', 'DESC']],
      transaction: t
    });

    let novoNumeroMatricula;
    if (ultimoEstudante) {
      const partes = ultimoEstudante.numeroMatricula.split('.');
      const sequencia = parseInt(partes[1], 10) + 1;
      novoNumeroMatricula = `${ano}.${sequencia.toString().padStart(3, '0')}`;
    } else {
      novoNumeroMatricula = `${ano}.001`;
    }

    const usernameFinal = novoNumeroMatricula; // Matrícula será o nome de usuário

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
      numeroMatricula: novoNumeroMatricula,
      nomeCompleto,
      numBi,
      curso_id: cursoId,
      classe,
      telefone,
      dataNascimento,
      ativo: false,
      statusMatricula: "pre-inscrito"
    }, { transaction: t });

    // Confirma as alterações na BD se tudo correu sem sobressaltos!
    await t.commit();

    return res.status(201).json({
      success: true,
      alert: {
        type: "success",
        message: "Pré-inscrição Realizada",
        description: "Pré-inscrição realizada com sucesso!"
      },
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
    await t.rollback(); // Se falhar, cancela tudo

    // Se escapar algum outro erro de restrição única do Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        mensagem: "Registo recusado.",
        erros: ["Alguns dos dados fornecidos já estão registados no sistema por outro utilizador."]
      });
    }

    // Mantém o log limpo no terminal para te ajudar a debugar caso seja outra coisa
    console.log("=========================================");
    console.error("❌ ERRO INTERNO DETECTADO:");
    console.error(err.parent ? err.parent.detail || err.parent.message : err.message);
    console.log("=========================================");

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


exports.atualizarUsuario = async (req, res, next) => {
  // Validar os campos que vieram no body
  const { error, value } = atualizarUsuarioSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errosDetalhados = error.details.map(err => err.message);
    return res.status(400).json({ 
      mensagem: "Erro de validação nos dados enviados.", 
      erros: errosDetalhados 
    });
  }

  const { id } = req.params; // ID do Estudante que queremos atualizar
  const t = await sequelize.transaction();

  try {
    // 1. Verificar se o estudante existe
    const estudante = await Estudante.findByPk(id, { transaction: t });
    if (!estudante) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Estudante não encontrado." });
    }

    // 2. Se foi enviado email ou senha, precisamos de atualizar o registro correspondente em 'usuarios'
    if (value.email || value.senha) {
      // Lembramos que o nomeUsuario do estudante é o seu número de matrícula
      const usuario = await Usuario.findOne({
        where: { nomeUsuario: estudante.numeroMatricula },
        transaction: t
      });

      if (usuario) {
        const dadosUsuarioUpdates = {};
        
        if (value.email) dadosUsuarioUpdates.email = value.email;
        if (value.senha) {
          dadosUsuarioUpdates.senhaHash = await bcrypt.hash(value.senha, 10);
        }

        await usuario.update(dadosUsuarioUpdates, { transaction: t });
      }
    }

    // 3. Preparar os dados de atualização da tabela 'estudantes'
    const dadosEstudanteUpdates = {};

    if (value.nomeCompleto) dadosEstudanteUpdates.nomeCompleto = value.nomeCompleto;
    if (value.numBi) dadosEstudanteUpdates.numBi = value.numBi;
    if (value.cursoId) dadosEstudanteUpdates.curso_id = value.cursoId; // Mapeia cursoId para curso_id (BD)
    if (value.classe) dadosEstudanteUpdates.classe = value.classe;
    if (value.telefone !== undefined) dadosEstudanteUpdates.telefone = value.telefone;
    if (value.dataNascimento !== undefined) dadosEstudanteUpdates.dataNascimento = value.dataNascimento;
    if (value.matriculaDoc !== undefined) dadosEstudanteUpdates.matriculaDoc = value.matriculaDoc;
    if (value.certificado !== undefined) dadosEstudanteUpdates.certificado = value.certificado;
    if (value.ativo !== undefined) dadosEstudanteUpdates.ativo = value.ativo;
    if (value.statusMatricula) dadosEstudanteUpdates.statusMatricula = value.statusMatricula;

    // 4. Salvar as alterações na tabela 'estudantes'
    await estudante.update(dadosEstudanteUpdates, { transaction: t });

    // Se tudo correu bem, persistimos no banco
    await t.commit();

    // Buscar o estudante atualizado para retornar na resposta
    const estudanteAtualizado = await Estudante.findByPk(id);

    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Dados Atualizados",
        description: "Dados do estudante atualizados com sucesso!"
      },
      estudante: estudanteAtualizado
    });

  } catch (err) {
    await t.rollback();
    next(err);
  }
};