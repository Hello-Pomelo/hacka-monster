-- Statistiques fictives pour la démo de l'écran Statistiques (/stats), en attendant la synchro LinkedIn.
-- À exécuter à la main (SQL Editor de Supabase ou psql), après la migration post_metrics.
-- Relançable sans risque : rien n'est dupliqué et aucun relevé existant n'est écrasé.

-- 1. (Optionnel) Posts publiés de démo -------------------------------------
-- Crée 16 posts publiés sur la page, sur les 6 derniers mois, répartis à tour de rôle entre
-- tous les comptes existants : chacun a ses posts, sans doublon (en v1, tous les posts sont
-- visibles par tous, D27). Ils portent `params.demo = true`, pour être retirés d'un coup (partie 3).
-- Résultat : nombre de comptes, de posts créés et d'auteurs servis.

with authors as (
  select p.id, row_number() over (order by p.created_at, p.id) - 1 as rank, count(*) over () as total
  from public.profiles p
),
demo as (
  select v.*,
         row_number() over (order by v.days_ago) - 1 as rank,
         ((((now() at time zone 'Europe/Paris')::date - v.days_ago) + v.at) at time zone 'Europe/Paris') as published
  from (values
    (3,   'newcomer',          'rh',        time '08:30', E'Bienvenue à Inès, notre nouvelle data engineer\n\nElle rejoint l''équipe data après cinq ans dans la grande distribution.'),
    (10,  'project_delivered', 'marketing', time '12:00', E'Projet livré : le tableau de bord commercial d''un distributeur régional\n\nLes commerciaux suivent maintenant leurs chiffres chaque matin, au lieu d''attendre trois jours.'),
    (17,  'tech_feedback',     'marketing', time '08:30', E'Ce que nous a appris notre migration vers PHP 8.4\n\nTrois surprises, et une bonne nouvelle sur les performances.'),
    (24,  'employer_brand',    'rh',        time '08:30', E'Une journée avec l''équipe mobile à Lyon\n\nDu point du matin à la mise en production du soir.'),
    (31,  'event',             'marketing', time '17:00', E'Retour sur notre meetup Symfony de septembre\n\n60 personnes, deux talks et beaucoup de questions sur les tests.'),
    (38,  'hiring',            'rh',        time '08:30', E'Nous recrutons un lead développeur PHP à Lyon\n\nUne équipe de huit personnes, des projets e-commerce exigeants.'),
    (45,  'employer_brand',    'rh',        time '12:00', E'Pourquoi nous gardons un vendredi par mois pour apprendre\n\nVeille, ateliers et side projects : ce que ça change pour l''équipe.'),
    (52,  'newcomer',          'rh',        time '08:30', E'Ils nous ont rejoints cet été : 4 nouveaux visages\n\nDéveloppeurs, designer et cheffe de projet.'),
    (66,  'tech_feedback',     'marketing', time '08:30', E'Tests de bout en bout : ce que nous avons arrêté de faire\n\nMoins de tests, mieux choisis, et une CI deux fois plus rapide.'),
    (80,  'event',             'marketing', time '18:00', E'Nos notes de la conférence PHP de juin\n\nCinq idées que nous allons tester dès la rentrée.'),
    (101, 'project_delivered', 'marketing', time '12:00', E'Une application de prise de commande livrée en 8 semaines\n\nPour une coopérative agricole et ses 200 adhérents.'),
    (112, 'newcomer',          'rh',        time '08:30', E'Bienvenue à Hugo, développeur back-end en alternance\n\nPremière pull request mergée dès la deuxième semaine.'),
    (125, 'employer_brand',    'rh',        time '08:30', E'Notre séminaire d''équipe au bord du lac\n\nDeux jours pour parler méthode, et un peu de paddle.'),
    (138, 'hiring',            'rh',        time '08:30', E'Deux postes de développeur front ouverts à Nantes\n\nVue, Nuxt et beaucoup de design system.'),
    (152, 'event',             'marketing', time '17:00', E'Nous étions au salon e-commerce de Paris\n\nMerci à toutes celles et ceux venus nous voir sur le stand.'),
    (171, 'project_delivered', 'marketing', time '12:00', E'Un site de réservation refondu pour un réseau de gîtes\n\nDeux fois plus de réservations directes en un trimestre.')
  ) as v(days_ago, type, line, at, content)
),
created as (
  insert into public.posts (
    author_id, type, cible, sujet, content, status, origin, editorial_line_id, params, scheduled_at, published_at
  )
  select a.id, d.type, 'entreprise', split_part(d.content, E'\n', 1), d.content, 'published', 'app',
         (select l.id from public.editorial_lines l where l.code = d.line),
         '{"demo": true}'::jsonb, d.published, d.published
  from demo d
  join authors a on a.rank = d.rank % a.total
  where not exists (
    select 1 from public.posts p where p.content = d.content and p.params ->> 'demo' = 'true'
  )
  returning author_id
)
select (select count(*) from authors) as comptes,
       (select count(*) from created) as posts_crees,
       (select count(distinct author_id) from created) as auteurs_servis;

-- 2. Relevés quotidiens pour les posts publiés sans statistiques -----------
-- Totaux tirés de l'identifiant du post (stables d'une exécution à l'autre), répartis
-- sur une courbe qui sature en quelques jours, comme sur LinkedIn. Un relevé par jour
-- pendant 60 jours après la publication, puis un relevé du jour pour les posts plus anciens.
-- Résultat : nombre de relevés créés et de posts concernés.

with targets as (
  select p.id, p.type,
         (coalesce(p.published_at, p.scheduled_at) at time zone 'Europe/Paris')::date as pub_day,
         ('x' || substr(md5(p.id::text), 1, 7))::bit(28)::int / 268435456.0 as r1,
         ('x' || substr(md5(p.id::text), 8, 7))::bit(28)::int / 268435456.0 as r2,
         ('x' || substr(md5(p.id::text), 15, 7))::bit(28)::int / 268435456.0 as r3,
         ('x' || substr(md5(p.id::text), 22, 7))::bit(28)::int / 268435456.0 as r4
  from public.posts p
  where p.status = 'published'
    and coalesce(p.published_at, p.scheduled_at) <= now()
    and not exists (select 1 from public.post_metrics m where m.post_id = p.id)
),
totals as (
  select t.id, t.pub_day, t.r3, t.r4,
         round(900 + t.r1 * 4200) as impressions,
         -- Taux d'interaction de base par type, à ±25 %
         (case t.type
            when 'newcomer' then 0.041
            when 'employer_brand' then 0.034
            when 'hiring' then 0.031
            when 'tech_feedback' then 0.029
            when 'event' then 0.026
            when 'project_delivered' then 0.022
            else 0.025
          end) * (0.75 + t.r2 * 0.5) as rate
  from targets t
),
today as (
  select (now() at time zone 'Europe/Paris')::date as day
),
inserted as (
  insert into public.post_metrics (post_id, captured_on, impressions, members_reached, reactions, comments, reposts, clicks)
  select tt.id,
         d.day,
         round(tt.impressions * s.share)::int,
         round(tt.impressions * (0.62 + tt.r4 * 0.15) * s.share)::int,
         round(tt.impressions * tt.rate * 0.82 * s.share)::int,
         round(tt.impressions * tt.rate * 0.13 * s.share)::int,
         round(tt.impressions * tt.rate * 0.05 * s.share)::int,
         round(tt.impressions * (0.006 + tt.r3 * 0.012) * s.share)::int
  from totals tt
  cross join today
  cross join lateral (
    select g::date as day
    from generate_series(tt.pub_day, least(today.day, tt.pub_day + 60), interval '1 day') g
    union
    select today.day where today.day > tt.pub_day + 60
  ) d
  cross join lateral (select 1 - exp(-((d.day - tt.pub_day) + 1) / 2.2) as share) s
  on conflict (post_id, captured_on) do nothing
  returning post_id
)
select count(*) as releves_crees, count(distinct post_id) as posts_concernes from inserted;

-- 3. Retirer la démo -------------------------------------------------------
-- À exécuter seul, une fois la démo passée. Supprime les posts de démo ; leurs relevés
-- partent en cascade. Si la partie 2 a aussi été lancée alors que de vrais posts étaient
-- publiés, leurs relevés fictifs restent : les supprimer avant la première vraie synchro.
--
-- delete from public.posts where params ->> 'demo' = 'true';
