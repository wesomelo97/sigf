-- Execute apos schema.sql e auditoria_emissoes.sql. Reexecutavel.
BEGIN;
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_papel_check;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_papel_check CHECK (papel IN ('admin','leitor','emissor'));
CREATE OR REPLACE FUNCTION public.eh_emissor_ou_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.perfis WHERE id = (SELECT auth.uid()) AND papel IN ('admin','emissor'));
$$;
REVOKE ALL ON FUNCTION public.eh_emissor_ou_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eh_emissor_ou_admin() TO authenticated;
DROP POLICY IF EXISTS "admin visualiza servidores" ON public.servidores;
DROP POLICY IF EXISTS "admin e emissor visualizam servidores" ON public.servidores;
CREATE POLICY "admin e emissor visualizam servidores" ON public.servidores
 FOR SELECT TO authenticated USING ((SELECT public.eh_emissor_ou_admin()));
DROP POLICY IF EXISTS "admin registra emissoes" ON public.emissoes_frequencia;
DROP POLICY IF EXISTS "admin e emissor registram emissoes" ON public.emissoes_frequencia;
CREATE POLICY "admin e emissor registram emissoes" ON public.emissoes_frequencia
 FOR INSERT TO authenticated WITH CHECK ((SELECT public.eh_emissor_ou_admin()) AND usuario_id = (SELECT auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.perfis FROM anon, authenticated;
REVOKE ALL ON public.servidores FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servidores TO authenticated;
GRANT SELECT ON public.perfis TO authenticated;
REVOKE ALL ON public.emissoes_frequencia FROM anon;
GRANT SELECT, INSERT ON public.emissoes_frequencia TO authenticated;
COMMIT;

-- Crie primeiro a conta em Authentication > Users. Depois rode:
-- UPDATE public.perfis SET papel='emissor' WHERE id =
-- (SELECT id FROM auth.users WHERE email='teste@sigf.com');
-- SELECT u.email,p.papel FROM auth.users u JOIN public.perfis p ON p.id=u.id WHERE u.email='teste@sigf.com';
