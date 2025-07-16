-- Membuat tabel untuk layanan digital
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_from DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membuat tabel untuk pesanan
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id),
    deadline DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
    work_notes TEXT,
    work_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membuat tabel profil user untuk freelancer dan admin
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'freelancer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies untuk services (semua bisa lihat)
CREATE POLICY "Anyone can view services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage services" 
ON public.services 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE telegram_user_id = current_setting('request.telegram_user_id', true) 
        AND role IN ('admin', 'freelancer')
    )
);

-- Policies untuk orders
CREATE POLICY "Users can view their own orders or admin/freelancer can view all" 
ON public.orders 
FOR SELECT 
USING (
    telegram_user_id = current_setting('request.telegram_user_id', true)
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE telegram_user_id = current_setting('request.telegram_user_id', true) 
        AND role IN ('admin', 'freelancer')
    )
);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (telegram_user_id = current_setting('request.telegram_user_id', true));

CREATE POLICY "Admin and freelancer can update orders" 
ON public.orders 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE telegram_user_id = current_setting('request.telegram_user_id', true) 
        AND role IN ('admin', 'freelancer')
    )
);

-- Policies untuk profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (telegram_user_id = current_setting('request.telegram_user_id', true));

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk auto update timestamp
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert data layanan digital
INSERT INTO public.services (name, description, price_from, category, icon_name) VALUES
('Desain Grafis', 'Logo, banner, poster, dan desain kreatif lainnya untuk kebutuhan bisnis Anda', 150000, 'design', 'Palette'),
('Penulisan Artikel', 'Artikel SEO, blog post, copywriting yang engaging dan berkualitas tinggi', 75000, 'writing', 'PenTool'),
('Penerjemahan', 'Terjemahan dokumen Indonesia-Inggris atau sebaliknya yang akurat dan professional', 50000, 'translation', 'Languages'),
('Edit Video', 'Editing video promosi, konten sosial media, dan video presentasi yang menarik', 200000, 'video', 'Video'),
('Pembuatan Website', 'Website landing page, company profile, dan web aplikasi custom sesuai kebutuhan', 500000, 'web', 'Code');