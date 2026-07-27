-- La policy DELETE precedente (using(true)) s'est averee inoperante en
-- pratique : sur ce schema, DELETE necessite aussi une visibilite SELECT sur
-- la ligne, qu'on ne veut surtout pas ouvrir publiquement (ca exposerait la
-- liste complete des emails abonnes). On passe par une fonction dediee,
-- suivant le meme pattern que is_admin()/get_admin_badges() deja en place :
-- elle s'execute avec les privileges de son proprietaire et ne verifie que
-- la correspondance email+token, sans jamais exposer les autres lignes.
drop policy if exists "public_unsubscribe_delete" on public.newsletter_subscribers;

create or replace function public.unsubscribe_newsletter(p_email text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.newsletter_subscribers
  where email = p_email and token = p_token;
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

grant execute on function public.unsubscribe_newsletter(text, text) to anon, authenticated;
