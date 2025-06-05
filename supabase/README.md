# Configuração do Banco de Dados Supabase

Este diretório contém os arquivos necessários para configurar o banco de dados Supabase para o sistema escolar.

## Estrutura do Banco de Dados

O arquivo `schema.sql` contém todas as definições de tabelas e políticas de segurança necessárias para o sistema. As tabelas incluem:

- `profiles`: Armazena informações de administradores e professores
- `classes`: Armazena informações sobre as turmas
- `students`: Armazena informações dos estudantes
- `subjects`: Armazena informações das disciplinas
- `attendances`: Registra a presença dos alunos
- `grades`: Registra as notas dos alunos

## Como Configurar o Banco de Dados

### Opção 1: Usando o Painel do Supabase

1. Acesse o [painel do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para a seção "SQL Editor"
4. Crie uma nova consulta
5. Copie e cole o conteúdo do arquivo `schema.sql`
6. Execute a consulta

### Opção 2: Usando a CLI do Supabase (requer Docker)

1. Instale o Docker Desktop
2. Instale a CLI do Supabase: `npm install -g supabase`
3. Inicie o Supabase localmente: `supabase start`
4. Execute o script SQL: `supabase db execute schema.sql`

## Políticas de Segurança (RLS)

O banco de dados utiliza Row Level Security (RLS) para garantir que os usuários só possam acessar os dados que têm permissão:

- **Administradores**: Têm acesso completo a todas as tabelas
- **Professores**: Podem visualizar todas as informações, mas só podem modificar dados relacionados às suas próprias disciplinas

## Autenticação

O sistema utiliza a autenticação do Supabase. Quando um novo usuário é registrado, um trigger automático cria um perfil correspondente na tabela `profiles`.

## Relacionamentos entre Tabelas

- Professores (profiles) podem ter várias disciplinas (subjects)
- Disciplinas (subjects) pertencem a um professor (profiles)
- Estudantes (students) pertencem a uma turma (classes)
- Turmas (classes) têm vários estudantes (students)
- Presenças (attendances) estão associadas a um estudante, uma disciplina e uma turma
- Notas (grades) estão associadas a um estudante e uma disciplina