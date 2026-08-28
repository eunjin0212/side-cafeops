-- ============================================================
-- Migration: Set explicit search_path on all SECURITY DEFINER
-- functions, mark get_leaderboard STABLE
--
-- SECURITY DEFINER functions run with the privileges of their
-- owner. Without an explicit search_path, a malicious search_path
-- set by the calling session could in principle cause the
-- function body to resolve an unqualified identifier to an
-- attacker-controlled object instead of the intended one
-- (search-path hijacking) -- the standard Postgres/Supabase
-- hardening recommendation for SECURITY DEFINER functions. Low
-- exploitability here (authenticated/anon can't create objects in
-- public on a managed Supabase project), but cheap defense-in-
-- depth. ALTER FUNCTION ... SET is used instead of redefining
-- each function body, since it only changes function config, not
-- behavior.
--
-- get_leaderboard() is also marked STABLE: it's a pure read-only
-- `LANGUAGE sql` function with no volatility marker (defaulted to
-- VOLATILE), which prevents the planner from caching/reusing its
-- result within a single statement. Not a correctness issue, just
-- a missed optimizer hint.
-- ============================================================

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_or_create_current_cycle() SET search_path = public;
ALTER FUNCTION public.is_privileged_actor() SET search_path = public;
ALTER FUNCTION public.get_profile_snapshot(uuid) SET search_path = public;
ALTER FUNCTION public.shares_active_location_with(uuid) SET search_path = public;
ALTER FUNCTION public.get_leaderboard(uuid) SET search_path = public;
ALTER FUNCTION public.get_leaderboard(uuid) STABLE;

-- ------------------------------------------------------------
-- Rollback
-- ------------------------------------------------------------
-- ALTER FUNCTION public.handle_new_user() RESET search_path;
-- ALTER FUNCTION public.get_or_create_current_cycle() RESET search_path;
-- ALTER FUNCTION public.is_privileged_actor() RESET search_path;
-- ALTER FUNCTION public.get_profile_snapshot(uuid) RESET search_path;
-- ALTER FUNCTION public.shares_active_location_with(uuid) RESET search_path;
-- ALTER FUNCTION public.get_leaderboard(uuid) RESET search_path;
-- ALTER FUNCTION public.get_leaderboard(uuid) VOLATILE;
