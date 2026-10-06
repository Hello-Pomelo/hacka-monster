-- Statistiques LinkedIn des posts publiés (écran Statistiques, /stats).
-- Un relevé par post et par jour : les totaux cumulés depuis la publication, tels que
-- LinkedIn les renvoie ce jour-là. LinkedIn ne fournit pas d'historique par post :
-- l'historique vient de ces relevés quotidiens. L'écran lit le dernier relevé de chaque post.

create table public.post_metrics (
  post_id uuid not null references public.posts (id) on delete cascade,
  -- Jour du relevé à Paris (la session Postgres est en UTC).
  captured_on date not null default ((now() at time zone 'Europe/Paris')::date),
  impressions integer not null default 0 check (impressions >= 0),
  members_reached integer check (members_reached >= 0),
  -- Pas de contrôle de signe : LinkedIn documente un likeCount qui peut devenir négatif.
  reactions integer not null default 0,
  comments integer not null default 0 check (comments >= 0),
  reposts integer not null default 0 check (reposts >= 0),
  clicks integer check (clicks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, captured_on)
);

comment on table public.post_metrics is
  'Relevé quotidien des totaux LinkedIn d''un post publié. Clé (post_id, captured_on) : un upsert par jour.';
comment on column public.post_metrics.impressions is
  'Page : totalShareStatistics.impressionCount. Compte perso (P2) : memberCreatorPostAnalytics IMPRESSION.';
comment on column public.post_metrics.members_reached is
  'Personnes uniques. Page : uniqueImpressionsCount (pas toujours renvoyé). Compte perso : MEMBERS_REACHED.';
comment on column public.post_metrics.reactions is
  'Page : likeCount (toutes réactions). Compte perso : REACTION.';
comment on column public.post_metrics.comments is
  'Page : commentCount. Compte perso : COMMENT.';
comment on column public.post_metrics.reposts is
  'Page : shareCount. Compte perso : RESHARE.';
comment on column public.post_metrics.clicks is
  'Page : clickCount. Null pour un compte perso : LinkedIn ne fournit pas de clics équivalents.';

create trigger post_metrics_set_updated_at
  before update on public.post_metrics
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------

alter table public.post_metrics enable row level security;

-- Lecture : les droits du post (en v1, tous les admins voient tous les posts, D27).
-- La sous-requête sur posts applique elle-même le RLS de posts.
create policy "post_metrics_select" on public.post_metrics
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_metrics.post_id));

-- Écriture par la synchro LinkedIn, avec la session d'un admin (service_role interdite dans l'app) :
-- post publié, et jour de relevé ni dans le futur ni avant la publication. Un relevé daté
-- dans le futur masquerait sinon tous les vrais relevés, puisque l'écran lit le plus récent.
create policy "post_metrics_insert" on public.post_metrics
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_metrics.post_id
        and p.status = 'published'
        and post_metrics.captured_on <= (now() at time zone 'Europe/Paris')::date
        and post_metrics.captured_on >= (
          coalesce(p.published_at, p.scheduled_at, p.created_at) at time zone 'Europe/Paris'
        )::date
    )
  );

create policy "post_metrics_update" on public.post_metrics
  for update to authenticated
  using (exists (select 1 from public.posts p where p.id = post_metrics.post_id))
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_metrics.post_id
        and p.status = 'published'
        and post_metrics.captured_on <= (now() at time zone 'Europe/Paris')::date
        and post_metrics.captured_on >= (
          coalesce(p.published_at, p.scheduled_at, p.created_at) at time zone 'Europe/Paris'
        )::date
    )
  );

revoke all on public.post_metrics from anon;
