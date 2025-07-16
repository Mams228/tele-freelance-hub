import { useState, useEffect } from 'react';
import { Service, OrderFormData } from '@/types/database';
import { ServiceCard } from '@/components/ServiceCard';
import { OrderForm } from '@/components/OrderForm';
import { AdminPanel } from '@/components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Users, Shield, Zap } from 'lucide-react';

type ViewMode = 'services' | 'order' | 'admin';

export default function Dashboard() {
  const { isReady, sendData, getUserId, getUserName } = useTelegram();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar layanan',
        variant: 'destructive'
      });
    }
  };

  const handleOrderService = (service: Service) => {
    setSelectedService(service);
    setCurrentView('order');
  };

  const handleSubmitOrder = async (orderData: OrderFormData) => {
    setIsLoading(true);
    try {
      // Create order in database
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          telegram_user_id: getUserId(),
          customer_name: getUserName(),
          service_id: orderData.service_id,
          contact_info: orderData.contact_info,
          deadline: orderData.deadline,
          notes: orderData.notes,
          status: 'new'
        })
        .select('*, service:services(*)')
        .single();

      if (error) throw error;

      // Send data to Telegram bot
      const telegramData = {
        type: 'new_order',
        order_id: order.id,
        customer_name: getUserName(),
        customer_id: getUserId(),
        service_name: selectedService?.name,
        contact_info: orderData.contact_info,
        deadline: orderData.deadline,
        notes: orderData.notes,
        price_from: selectedService?.price_from
      };

      sendData(telegramData);

      toast({
        title: 'Pesanan Berhasil Dikirim!',
        description: 'Freelancer akan segera menghubungi Anda untuk konfirmasi detail.'
      });

      // Reset to services view
      setCurrentView('services');
      setSelectedService(null);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengirim pesanan. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToServices = () => {
    setCurrentView('services');
    setSelectedService(null);
  };

  // Show loading while Telegram is initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Menginisialisasi Telegram Mini App...</p>
        </div>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'admin') {
    return <AdminPanel />;
  }

  if (currentView === 'order' && selectedService) {
    return (
      <OrderForm
        service={selectedService}
        onSubmit={handleSubmitOrder}
        onBack={handleBackToServices}
        isLoading={isLoading}
      />
    );
  }

  // Main services view
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary-glow" />
            <h1 className="text-4xl font-bold text-primary-foreground">
              Tele Freelance Hub
            </h1>
          </div>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Platform jasa digital terpercaya langsung dari Telegram
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Freelancer Berpengalaman</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Garansi Kepuasan</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Pengerjaan Cepat</span>
            </div>
          </div>
        </div>

        {/* Admin Panel Access */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentView('admin')}
            className="text-xs"
          >
            Panel Admin
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onOrder={handleOrderService}
            />
          ))}
        </div>

        {/* Why Choose Us */}
        <Card className="bg-gradient-card shadow-floating border-0 mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Mengapa Memilih Kami?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Proses Cepat</h3>
                <p className="text-sm text-muted-foreground">
                  Pesan langsung dari Telegram, tanpa perlu keluar aplikasi
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Tim Profesional</h3>
                <p className="text-sm text-muted-foreground">
                  Freelancer berpengalaman dengan portofolio yang terbukti
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Hasil Berkualitas</h3>
                <p className="text-sm text-muted-foreground">
                  Garansi revisi dan kepuasan pelanggan 100%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-primary-foreground/60 text-sm">
          <p>© 2024 Tele Freelance Hub. Dibuat dengan ❤️ untuk komunitas Telegram Indonesia</p>
        </div>
      </div>
    </div>
  );
}