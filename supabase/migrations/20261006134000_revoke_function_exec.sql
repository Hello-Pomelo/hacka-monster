-- handle_new_user n'est appelée que par le trigger : aucun rôle de l'API ne doit pouvoir l'exécuter.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_reviewer est utilisée par les policies RLS des utilisateurs connectés uniquement.
revoke execute on function public.is_reviewer() from public, anon;
grant execute on function public.is_reviewer() to authenticated;
