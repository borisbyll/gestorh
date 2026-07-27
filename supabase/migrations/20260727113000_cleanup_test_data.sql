-- Nettoyage des donnees de test creees pendant l'audit/les verifications
delete from public.reviews where author_name in ('Audit Test6 (a supprimer)', 'Audit Bypass Attempt');
