# Avance - Apoio Escolar

## Como usar na empresa

### 1. Perfis de Usuário
- **Admin:** pode cadastrar/excluir usuários, acessar todos os dados.
- **Professor:** pode lançar frequência, gerenciar alunos e visualizar dados.
- **Aluno:** pode visualizar apenas seus próprios dados (implemente conforme necessidade).

### 2. Cadastro de Usuários
- O primeiro usuário admin deve ser cadastrado manualmente no banco ou alterando o perfil após cadastro.
- Para criar um admin: cadastre normalmente e altere o campo `funcao` para `Admin` na tabela `users`.

### 3. Segurança
- O segredo da sessão deve ser definido na variável de ambiente `SESSION_SECRET`.
- Senhas são protegidas por hash.

### 4. Controle de Acesso
- Apenas admins podem gerenciar usuários.
- Apenas professores/admins podem gerenciar alunos e frequência.

### 5. Responsividade e Acessibilidade
- O sistema é responsivo e pode ser usado em desktop e mobile.
- Melhorias de acessibilidade aplicadas.

### 6. Erros e Validações
- Campos obrigatórios são validados no backend.
- Mensagens de erro são exibidas para o usuário.

### 7. Suporte
- Para dúvidas ou melhorias, consulte o desenvolvedor responsável.
