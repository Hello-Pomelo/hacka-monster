-- Données de démo (fictives). À remplacer par la vraie ligne éditoriale fournie par le marketing.

insert into public.editorial_line (id, ton, valeurs, mots_a_eviter, exemples)
values (
  1,
  'Chaleureux, direct et concret. On parle au « nous », on tutoie le lecteur avec bienveillance. Pas de jargon marketing creux : des faits, des personnes, des résultats.',
  'Proximité avec les clients, artisanat du code, transmission, plaisir de travailler ensemble.',
  'disruptif, synergie, game changer, révolutionnaire, n''hésitez pas',
  E'Exemple 1 :\nIl y a 6 mois, Léa rejoignait l''équipe en alternance.\nAujourd''hui, elle a mis en production sa première fonctionnalité. 🚀\n\nCe qu''on retient : poser des questions, c''est déjà avancer.\n\nBravo Léa, et merci à toute l''équipe qui l''a accompagnée.\n\n#MarqueEmployeur #Alternance'
)
on conflict (id) do update set
  ton = excluded.ton,
  valeurs = excluded.valeurs,
  mots_a_eviter = excluded.mots_a_eviter,
  exemples = excluded.exemples;

-- Passer un utilisateur en relecteur (après son inscription dans l'app) :
-- update public.profiles set role = 'relecteur' where id = (select id from auth.users where email = 'prenom@exemple.fr');
