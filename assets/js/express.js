app.post('/login', async (req, res) => {
  const { login, senha } = req.body;
  try {
    const [user] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? OR telefone = ?',
      [login, login]
    );
    if (!user.length) return res.status(404).json({ error: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, user[0].senha);
    if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

    req.session.userId = user[0].id;
    res.json({ message: 'Login realizado com sucesso', user: user[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/recuperar-senha/solicitar', async (req, res) => {
  const { contato } = req.body;
  const eEmail = contato.includes('@');

  const [user] = await db.query(
    `SELECT * FROM usuarios WHERE ${eEmail ? 'email' : 'telefone'} = ?`,
    [contato]
  );

  if (!user.length) {
    return res.status(404).json({ error: 'Contato não cadastrado' });
  }

  const codigoToken = Math.floor(100000 + Math.random() * 900000).toString();

  await db.query(
    'UPDATE usuarios SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
    [codigoToken, user[0].id]
  );

  res.json({ message: `Código de verificação enviado para seu ${eEmail ? 'e-mail' : 'telefone'}.` });
});

app.post('/recuperar-senha/redefinir', async (req, res) => {
  const { contato, codigo, novaSenha } = req.body;
  const eEmail = contato.includes('@');

  const [user] = await db.query(
    `SELECT * FROM usuarios WHERE ${eEmail ? 'email' : 'telefone'} = ? AND reset_token = ? AND reset_token_expires > NOW()`,
    [contato, codigo]
  );

  if (!user.length) {
    return res.status(400).json({ error: 'Código inválido ou expirado' });
  }

  const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
  await db.query(
    'UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
    [novaSenhaHash, user[0].id]
  );

  res.json({ message: 'Senha alterada com sucesso!' });
});
