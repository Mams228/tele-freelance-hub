import { useState } from 'react';
import { Service, OrderFormData } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

interface OrderFormProps {
  service: Service;
  onSubmit: (data: OrderFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function OrderForm({ service, onSubmit, onBack, isLoading }: OrderFormProps) {
  const { getUserName } = useTelegram();
  const [formData, setFormData] = useState<OrderFormData>({
    service_id: service.id,
    contact_info: '',
    deadline: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format harga dalam Rupiah
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Form Pemesanan</h1>
      </div>

      {/* Service Summary */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Harga mulai dari:</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(service.price_from)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Detail Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name (Auto-filled from Telegram) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Nama Pemesan
              </Label>
              <Input
                value={getUserName()}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Diambil otomatis dari akun Telegram Anda
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <Label htmlFor="contact">Email atau Nomor WhatsApp *</Label>
              <Input
                id="contact"
                type="text"
                placeholder="contoh@email.com atau 08123456789"
                value={formData.contact_info}
                onChange={(e) => handleChange('contact_info', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Kami akan menghubungi Anda melalui kontak ini
              </p>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Deadline Pekerjaan *
              </Label>
              <Input
                id="deadline"
                type="date"
                min={minDate}
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimal 1 hari dari sekarang
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Catatan Tambahan
              </Label>
              <Textarea
                id="notes"
                placeholder="Jelaskan detail kebutuhan Anda, referensi, atau instruksi khusus..."
                rows={4}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Semakin detail, semakin baik hasil yang kami berikan
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="telegram" 
              size="lg" 
              className="w-full"
              disabled={isLoading || !formData.contact_info || !formData.deadline}
            >
              {isLoading ? 'Mengirim Pesanan...' : 'Kirim Pesanan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-accent/50 border-accent">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Dengan mengirim pesanan, Anda menyetujui bahwa data akan dikirim ke freelancer 
            melalui Telegram Bot untuk diproses lebih lanjut.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}