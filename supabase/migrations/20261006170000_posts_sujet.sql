-- Sujet du post, saisi dans la fenêtre « Paramétrer votre post » : sert de titre dans le calendrier et les listes.
alter table public.posts add column sujet text not null default '';
