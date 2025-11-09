-- App configuration table and seed

CREATE TABLE IF NOT EXISTS public.app_configuration (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	school_name VARCHAR(255) NOT NULL DEFAULT 'Pison Academy',
	school_logo_url TEXT,
	primary_color VARCHAR(7) DEFAULT '#1E293B',
	secondary_color VARCHAR(7) DEFAULT '#0EA5E9',
	contact_email VARCHAR(255),
	contact_phone VARCHAR(20),
	address TEXT,
	settings JSONB DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger
DROP TRIGGER IF EXISTS trg_app_configuration_set_updated_at ON public.app_configuration;
CREATE TRIGGER trg_app_configuration_set_updated_at
	BEFORE UPDATE ON public.app_configuration
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed one default row if table empty
INSERT INTO public.app_configuration (school_name)
SELECT 'Pison Academy'
WHERE NOT EXISTS (SELECT 1 FROM public.app_configuration);

