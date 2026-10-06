-- Modèle de données des specs (docs/specs) : statuts et transitions (Création de post),
-- lignes éditoriales, charte, séries, connexion LinkedIn (Paramétrage), idées et suggestions (Mon calendrier).
-- v1 : tout utilisateur connecté est admin et voit tous les posts de la page (D27).
-- L'ancienne table editorial_line reste en place tant que le code de main la lit.

-- Rôles : un seul rôle en v1 ---------------------------------------------

drop policy if exists "editorial_line_update" on public.editorial_line;
drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_insert" on public.posts;
drop policy if exists "posts_update_author" on public.posts;
drop policy if exists "posts_update_reviewer" on public.posts;
drop policy if exists "posts_delete_author" on public.posts;
drop function if exists public.is_reviewer();

alter table public.profiles alter column role drop default;
alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('admin', 'contributor');
alter table public.profiles alter column role type public.user_role using 'admin'::public.user_role;
alter table public.profiles alter column role set default 'admin';
drop type public.user_role_old;

-- Statuts des posts (spec Création de post) ----------------------------

alter table public.posts alter column status drop default;
alter type public.post_status rename to post_status_old;
create type public.post_status as enum (
  'draft', 'pending', 'scheduled', 'publishing', 'published', 'failed', 'archived'
);
alter table public.posts alter column status type public.post_status using (
  case status::text
    when 'brouillon' then 'draft'
    when 'en_relecture' then 'pending'
    when 'valide' then 'scheduled'
    when 'publie' then 'published'
  end
)::public.post_status;
alter table public.posts alter column status set default 'draft';
drop type public.post_status_old;

create type public.post_origin as enum ('app', 'linkedin_import');
create type public.client_status as enum ('citable', 'citable_without_detail', 'not_citable');

-- Lignes éditoriales (spec Paramétrage, D4, D13, D22) ------------------

create table public.editorial_lines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('marketing', 'rh', 'neutre')),
  name text not null,
  configured boolean not null default false,
  brand text not null default '',
  about text not null default '',
  core_values text[] not null default '{}',
  targets text not null default '',
  voice_adjectives text[] not null default '{}',
  we_are text[] not null default '{}',
  we_are_not text[] not null default '{}',
  pillars text[] not null default '{}',
  -- Objectif de rythme de la ligne, en posts par semaine (D22, défaut : 1).
  target_per_week numeric(4, 2) not null default 1 check (target_per_week > 0),
  -- Réglages par défaut d'un post : ton, longueur, emojis, hashtags, appel à l'action.
  defaults jsonb not null default '{}'::jsonb,
  reference_posts text[] not null default '{}',
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.profiles
  add column line_id uuid references public.editorial_lines (id) on delete set null,
  add column onboarded_at timestamptz;

-- Charte commune et clients (spec Paramétrage, D7, D17, D24) ------------

create table public.charter (
  id smallint primary key default 1 check (id = 1),
  banned_expressions text[] not null default '{}',
  sensitive_topics text[] not null default '{}',
  address_form text not null default 'vous' check (address_form in ('tu', 'vous')),
  inclusive_writing boolean not null default false,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.charter_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  aliases text[] not null default '{}',
  status public.client_status not null default 'citable',
  created_at timestamptz not null default now()
);

-- Séries (spec Création de post, P0 2 et 3) -----------------------------

create table public.series (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  editorial_line_id uuid references public.editorial_lines (id) on delete set null,
  type text not null,
  subject text not null check (length(trim(subject)) > 0),
  brief text not null default '',
  -- Réglages du post et calendrier de la série : fréquence, jour, heure, fuseau, début, fin ou nombre.
  settings jsonb not null default '{}'::jsonb,
  -- Ligne et charte figées à la génération (spec Paramétrage, section 4).
  line_snapshot jsonb not null default '{}'::jsonb,
  charter_snapshot jsonb not null default '{}'::jsonb,
  angle_plan jsonb,
  created_at timestamptz not null default now()
);

-- Posts : champs des specs ---------------------------------------------

alter table public.posts alter column cible set default 'entreprise';
alter table public.posts
  add column series_id uuid references public.series (id) on delete set null,
  add column editorial_line_id uuid references public.editorial_lines (id) on delete set null,
  add column origin public.post_origin not null default 'app',
  add column angle text,
  add column validated_at timestamptz,
  add column validated_by uuid references public.profiles (id) on delete set null,
  add column guardrail_report jsonb,
  add column image_path text,
  add column image_alt text,
  add column publishing_started_at timestamptz,
  add column published_at timestamptz,
  add column linkedin_post_urn text,
  add column linkedin_url text,
  add column failure_reason text;

alter table public.posts
  add constraint posts_content_length check (char_length(content) <= 3000);

create index posts_series_id_idx on public.posts (series_id);
create index posts_scheduled_at_idx on public.posts (scheduled_at);
-- Un post LinkedIn n'est importé ou publié qu'une fois (zéro doublon).
create unique index posts_linkedin_post_urn_key on public.posts (linkedin_post_urn)
  where linkedin_post_urn is not null;

-- Transitions de statut (spec Création de post, P2 « machine à états ») --

create table public.post_transitions (
  from_status public.post_status not null,
  to_status public.post_status not null,
  actor text not null check (actor in ('author', 'system')),
  enabled boolean not null default true,
  primary key (from_status, to_status)
);

insert into public.post_transitions (from_status, to_status, actor, enabled) values
  ('draft', 'scheduled', 'author', true),
  ('scheduled', 'draft', 'author', true),
  ('scheduled', 'publishing', 'system', true),
  ('publishing', 'published', 'system', true),
  ('publishing', 'failed', 'system', true),
  ('failed', 'scheduled', 'author', true),
  ('draft', 'archived', 'author', true),
  ('scheduled', 'archived', 'author', true),
  ('failed', 'archived', 'author', true),
  ('published', 'archived', 'author', true),
  ('archived', 'draft', 'author', true),
  ('archived', 'published', 'author', true),
  -- P1 (relecture) : désactivées en v1.
  ('draft', 'pending', 'author', false),
  ('pending', 'scheduled', 'author', false),
  ('pending', 'draft', 'author', false);

-- Contrôle des transitions et de la lecture seule. Un appel depuis l'API (rôle
-- authenticated) est une action d'auteur ; une fonction security definer est le système.
create function public.check_post_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_actor text := case when current_user in ('authenticated', 'anon') then 'author' else 'system' end;
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1 from public.post_transitions t
      where t.from_status = old.status and t.to_status = new.status
        and t.actor = v_actor and t.enabled
    ) then
      raise exception 'Transition % -> % refusée', old.status, new.status using errcode = 'P0001';
    end if;

    if new.status = 'scheduled' then
      if length(trim(new.content)) = 0 then
        raise exception 'Texte vide' using errcode = 'P0001';
      end if;
      if new.scheduled_at is null or new.scheduled_at <= now() then
        raise exception 'Date de publication passée' using errcode = 'P0001';
      end if;
    end if;

    if old.status = 'archived' then
      if new.status = 'published' and old.published_at is null then
        raise exception 'Post jamais publié' using errcode = 'P0001';
      end if;
      if new.status = 'draft' and old.published_at is not null then
        raise exception 'Post déjà publié' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- En cours, Publié et Archivé : texte, date et image en lecture seule.
  if old.status in ('publishing', 'published', 'archived')
    and (new.content is distinct from old.content
      or new.scheduled_at is distinct from old.scheduled_at
      or new.image_path is distinct from old.image_path
      or new.image_alt is distinct from old.image_alt) then
    raise exception 'Post en lecture seule' using errcode = 'P0001';
  end if;

  -- Un post importé de LinkedIn ne change jamais.
  if old.origin = 'linkedin_import' and v_actor = 'author' then
    raise exception 'Post importé en lecture seule' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger posts_check_update
  before update on public.posts
  for each row execute function public.check_post_update();

-- Connexion LinkedIn (spec Paramétrage E0, Création de post E7) ---------

create table public.linkedin_connection (
  id smallint primary key default 1 check (id = 1),
  -- `demo` : connexion simulée tant que l'app LinkedIn n'est pas configurée.
  mode text not null default 'linkedin' check (mode in ('linkedin', 'demo')),
  target_urn text not null,
  target_name text not null,
  target_logo_url text,
  admin_user_id uuid references public.profiles (id) on delete set null,
  -- Chiffré côté serveur (AES-256-GCM, clé LINKEDIN_TOKEN_KEY). Jamais lu par le navigateur.
  access_token_encrypted text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  last_import_at timestamptz,
  connected_at timestamptz not null default now()
);

-- Boîte à idées partagée (D28) et suggestions ignorées ------------------

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  text text not null check (length(trim(text)) > 0 and length(text) <= 500),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.dismissed_suggestions (
  suggestion_key text primary key,
  dismissed_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  dismissed_at timestamptz not null default now()
);

-- updated_at ------------------------------------------------------------

create trigger editorial_lines_set_updated_at
  before update on public.editorial_lines
  for each row execute function public.set_updated_at();

create trigger charter_set_updated_at
  before update on public.charter
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------

alter table public.editorial_lines enable row level security;
alter table public.charter enable row level security;
alter table public.charter_clients enable row level security;
alter table public.series enable row level security;
alter table public.post_transitions enable row level security;
alter table public.linkedin_connection enable row level security;
alter table public.ideas enable row level security;
alter table public.dismissed_suggestions enable row level security;

-- Ancienne ligne éditoriale : modifiable par tout admin connecté.
create policy "editorial_line_update" on public.editorial_line
  for update to authenticated using (true) with check (true);

-- Profils : chacun met à jour son nom, sa ligne et son onboarding.
revoke update on public.profiles from authenticated;
grant update (nom, line_id, onboarded_at) on public.profiles to authenticated;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Posts : tous les posts de la page sont visibles et modifiables par les admins (D27).
-- Le trigger posts_check_update garde les transitions et la lecture seule.
create policy "posts_select" on public.posts
  for select to authenticated using (true);
-- Création dans l'app en Brouillon, ou import depuis LinkedIn en Publié (lecture seule ensuite).
create policy "posts_insert" on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and ((origin = 'app' and status = 'draft') or (origin = 'linkedin_import' and status = 'published'))
  );
create policy "posts_update" on public.posts
  for update to authenticated
  using (status <> 'publishing')
  with check (true);
create policy "posts_delete_draft" on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()) and status = 'draft' and origin = 'app');

-- Lignes : lisibles par tous ; un admin modifie la ligne de son équipe (D15). Neutre est figée.
create policy "editorial_lines_select" on public.editorial_lines
  for select to authenticated using (true);
create policy "editorial_lines_update" on public.editorial_lines
  for update to authenticated
  using (code <> 'neutre' and id = (select line_id from public.profiles where id = (select auth.uid())))
  with check (code <> 'neutre');

-- Charte : lisible et modifiable par tous les admins (D24).
create policy "charter_select" on public.charter for select to authenticated using (true);
create policy "charter_update" on public.charter for update to authenticated using (true) with check (true);
create policy "charter_clients_all" on public.charter_clients
  for all to authenticated using (true) with check (true);

-- Séries : visibles par tous, créées pour soi.
create policy "series_select" on public.series for select to authenticated using (true);
create policy "series_insert" on public.series
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "series_update" on public.series
  for update to authenticated using (true) with check (true);

create policy "post_transitions_select" on public.post_transitions
  for select to authenticated using (true);

-- Connexion LinkedIn : le jeton chiffré n'est jamais lisible depuis l'API.
create policy "linkedin_connection_select" on public.linkedin_connection
  for select to authenticated using (true);
create policy "linkedin_connection_insert" on public.linkedin_connection
  for insert to authenticated with check (admin_user_id = (select auth.uid()));
create policy "linkedin_connection_update" on public.linkedin_connection
  for update to authenticated using (true) with check (true);
create policy "linkedin_connection_delete" on public.linkedin_connection
  for delete to authenticated using (true);
revoke select on public.linkedin_connection from anon, authenticated;
grant select (
  id, mode, target_urn, target_name, target_logo_url, admin_user_id,
  expires_at, scopes, last_import_at, connected_at
) on public.linkedin_connection to authenticated;

create policy "ideas_select" on public.ideas for select to authenticated using (true);
create policy "ideas_insert" on public.ideas
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "ideas_delete" on public.ideas for delete to authenticated using (true);

create policy "dismissed_suggestions_select" on public.dismissed_suggestions
  for select to authenticated using (true);
create policy "dismissed_suggestions_insert" on public.dismissed_suggestions
  for insert to authenticated with check (dismissed_by = (select auth.uid()));
create policy "dismissed_suggestions_delete" on public.dismissed_suggestions
  for delete to authenticated using (true);

-- Publication à date (spec Création de post, P0 7) ----------------------
-- Appelées par /api/cron/publish sans session : protégées par le secret `cron_secret` du Vault.

create schema if not exists private;

create function private.check_cron_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null or p_secret is distinct from (
    select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1
  ) then
    raise exception 'Secret invalide' using errcode = '42501';
  end if;
end;
$$;

-- Contexte de publication : connexion (jeton chiffré), charte active et clients.
create function public.cron_publication_context(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_cron_secret(p_secret);
  return jsonb_build_object(
    'connection', (select to_jsonb(c) from public.linkedin_connection c where c.id = 1),
    'charter', (select to_jsonb(ch) from public.charter ch where ch.id = 1),
    'clients', coalesce((select jsonb_agg(to_jsonb(cl)) from public.charter_clients cl), '[]'::jsonb)
  );
end;
$$;

-- Prend les posts arrivés à date (verrou : deux exécutions ne prennent jamais le même post),
-- et passe en Échec les posts restés En cours plus de 10 minutes.
create function public.cron_claim_due_posts(p_secret text, p_limit integer default 10)
returns setof public.posts
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_cron_secret(p_secret);

  update public.posts
  set status = 'failed',
      failure_reason = 'Nous ne savons pas si ce post a été publié. Vérifiez sur LinkedIn avant de le reprogrammer.'
  where status = 'publishing' and publishing_started_at < now() - interval '10 minutes';

  return query
  update public.posts p
  set status = 'publishing', publishing_started_at = now(), failure_reason = null
  where p.id in (
    select id from public.posts
    where status = 'scheduled' and scheduled_at <= now()
    order by scheduled_at
    limit p_limit
    for update skip locked
  )
  returning p.*;
end;
$$;

create function public.cron_complete_post(
  p_secret text,
  p_post_id uuid,
  p_success boolean,
  p_linkedin_post_urn text default null,
  p_linkedin_url text default null,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_cron_secret(p_secret);

  if p_success then
    update public.posts
    set status = 'published', published_at = now(),
        linkedin_post_urn = p_linkedin_post_urn, linkedin_url = p_linkedin_url
    where id = p_post_id and status = 'publishing';
  else
    update public.posts
    set status = 'failed', failure_reason = coalesce(p_failure_reason, 'Erreur LinkedIn.')
    where id = p_post_id and status = 'publishing';
  end if;
end;
$$;

revoke execute on function private.check_cron_secret(text) from public, anon, authenticated;
revoke execute on function public.check_post_update() from public, anon, authenticated;
revoke execute on function public.cron_publication_context(text) from public;
revoke execute on function public.cron_claim_due_posts(text, integer) from public;
revoke execute on function public.cron_complete_post(text, uuid, boolean, text, text, text) from public;
grant execute on function public.cron_publication_context(text) to anon, authenticated;
grant execute on function public.cron_claim_due_posts(text, integer) to anon, authenticated;
grant execute on function public.cron_complete_post(text, uuid, boolean, text, text, text) to anon, authenticated;

-- Images des posts (spec Création de post, P0 9) ------------------------
-- Bucket public : LinkedIn récupère l'image à la publication ; écriture réservée aux admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do nothing;

create policy "post_images_select" on storage.objects
  for select to authenticated using (bucket_id = 'post-images');
create policy "post_images_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images');
create policy "post_images_update" on storage.objects
  for update to authenticated using (bucket_id = 'post-images');
create policy "post_images_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'post-images');

-- Données de départ : trois lignes et la charte -------------------------

insert into public.editorial_lines (code, name, configured) values
  ('marketing', 'Marketing', false),
  ('rh', 'RH', false),
  ('neutre', 'Neutre', true)
on conflict (code) do nothing;

insert into public.charter (id, banned_expressions) values (
  1,
  array[
    'Je suis ravi de vous annoncer', 'Nous sommes fiers de', 'disruptif', 'synergie',
    'game changer', 'révolutionnaire', 'n''hésitez pas', 'Et vous ?', 'Qu''en pensez-vous ?'
  ]
) on conflict (id) do nothing;
