-- Suppression du compte de test cree pendant l'audit de securite (cascade
-- vers user_profiles/identities/sessions grace aux FK ON DELETE CASCADE)
delete from auth.users where id = '1ee530c9-2bb9-4e67-a856-a456ab44c107';
