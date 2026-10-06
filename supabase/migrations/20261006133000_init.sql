-- Schéma initial : profils, ligne éditoriale, posts (cf. docs/cahier-des-charges.md F1 à F7)

create type public.user_role as enum ('auteur', 'relecteur');
create type public.post_status as enum ('brouillon', 'en_relecture', 'valide', 'publie');
create type public.post_target as enum ('perso', 'entreprise');

-- Profils ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null default '',
  role public.user_role not null default 'auteur',
  created_at timestamptz not null default now()
);

-- Crée le profil à l'inscription (nom lu dans les métadonnées, sinon l'e-mail)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nom', new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vrai si l'utilisateur courant est relecteur
create function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'relecteur'
  );
$$;

-- Ligne éditoriale (une seule ligne) ------------------------------------

create table public.editorial_line (
  id smallint primary key default 1 check (id = 1),
  ton text not null default '',
  valeurs text not null default '',
  mots_a_eviter text not null default '',
  exemples text not null default '',
  updated_at timestamptz not null default now()
);

-- Posts -----------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type text not null,
  cible public.post_target not null default 'perso',
  answers jsonb not null default '{}'::jsonb,
  params jsonb not null default '{}'::jsonb,
  content text not null default '',
  status public.post_status not null default 'brouillon',
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_status_idx on public.posts (status);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger editorial_line_set_updated_at
  before update on public.editorial_line
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.editorial_line enable row level security;
alter table public.posts enable row level security;

-- Profils : lisibles par tous les connectés (vue relecteur), non modifiables depuis l'app
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

-- Ligne éditoriale : lue par tous, modifiée par les relecteurs
create policy "editorial_line_select" on public.editorial_line
  for select to authenticated using (true);

create policy "editorial_line_update" on public.editorial_line
  for update to authenticated
  using ((select public.is_reviewer()))
  with check ((select public.is_reviewer()));

-- Posts : l'auteur voit les siens, le relecteur voit tout
create policy "posts_select" on public.posts
  for select to authenticated
  using (author_id = (select auth.uid()) or (select public.is_reviewer()));

-- Création : uniquement pour soi, en brouillon
create policy "posts_insert" on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'brouillon');

-- Auteur : modifie ses posts non publiés. Un post page entreprise ne peut pas
-- être validé ou publié par son auteur (relecture obligatoire).
create policy "posts_update_author" on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()) and status <> 'publie')
  with check (
    author_id = (select auth.uid())
    and (cible = 'perso' or status in ('brouillon', 'en_relecture'))
  );

-- Relecteur : modifie et change le statut de tous les posts
create policy "posts_update_reviewer" on public.posts
  for update to authenticated
  using ((select public.is_reviewer()))
  with check ((select public.is_reviewer()));

-- Suppression : l'auteur supprime ses brouillons
create policy "posts_delete_author" on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()) and status = 'brouillon');
