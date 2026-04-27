-- Revoke EXECUTE from anon/authenticated on internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, public;

-- has_role must remain callable by authenticated (used in RLS), keep it.
-- But ensure search_path explicitly set (already done in CREATE).