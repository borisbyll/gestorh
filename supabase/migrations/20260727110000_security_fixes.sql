-- Sécurité : empêche un appel direct à l'API de publier un avis non modéré
-- (le client envoyait approved:false mais rien ne l'empêchait d'envoyer true)
alter policy "public_insert" on public.reviews
  with check (approved = false);

-- Sécurité + correctif fonctionnel : le désabonnement newsletter n'avait
-- aucune policy DELETE pour les visiteurs anonymes, donc UnsubscribePage
-- échouait silencieusement (0 ligne supprimée, mais succès affiché).
-- On autorise la suppression ; la vérification d'identité (token) est
-- appliquée côté application via le filtre .eq('token', ...).
create policy "public_unsubscribe_delete" on public.newsletter_subscribers
  for delete
  to anon, authenticated
  using (true);
