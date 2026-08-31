-- Execute este script inteiro no SQL Editor do Supabase (New query -> colar -> Run)

-- Tabela de perfis: guarda a data de validade e o status de cada usuário
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  expires_at date not null,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Ativa segurança em nível de linha (cada usuário só enxerga o próprio perfil)
alter table public.profiles enable row level security;

create policy "Usuário vê apenas o próprio perfil"
  on public.profiles for select
  using ( auth.uid() = id );
