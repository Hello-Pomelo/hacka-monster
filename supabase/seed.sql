-- Données de démo (fictives). À remplacer par la vraie ligne éditoriale fournie par le marketing.

insert into public.editorial_line (id, ton, valeurs, mots_a_eviter, exemples)
values (
  1,
  'Chaleureux, direct et concret. On parle au « nous », on tutoie le lecteur avec bienveillance. Pas de jargon marketing creux : des faits, des personnes, des résultats.',
  'Proximité avec les clients, artisanat du code, transmission, plaisir de travailler ensemble.',
  'disruptif, synergie, game changer, révolutionnaire, n''hésitez pas, Et vous ?, Qu''en pensez-vous ?',
  E'Exemple 1 :\nIl y a 6 mois, Léa rejoignait l''équipe en alternance. Mardi, elle a mis en production sa première fonctionnalité : l''export des commandes pour un distributeur de 300 personnes.\n\nSes premières semaines, elle a posé beaucoup de questions. Thomas et Inès ont relu chacune de ses pull requests.\n\nLes commerciaux du client récupèrent maintenant leurs commandes en un clic, au lieu d''une demande par mail.\n\nBravo Léa.\n\n#Alternance #MarqueEmployeur'
)
on conflict (id) do update set
  ton = excluded.ton,
  valeurs = excluded.valeurs,
  mots_a_eviter = excluded.mots_a_eviter,
  exemples = excluded.exemples;

-- Passer un utilisateur en relecteur (après son inscription dans l'app) :
-- update public.profiles set role = 'relecteur' where id = (select id from auth.users where email = 'prenom@exemple.fr');
