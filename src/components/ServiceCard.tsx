import { Service } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onOrder: (service: Service) => void;
}

export function ServiceCard({ service, onOrder }: ServiceCardProps) {
  // Get icon component dynamically
  const IconComponent = service.icon_name && service.icon_name in LucideIcons 
    ? (LucideIcons as any)[service.icon_name]
    : LucideIcons.Briefcase;

  // Format harga dalam Rupiah
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="h-full bg-gradient-card shadow-card hover:shadow-floating transition-all duration-300 hover:-translate-y-1 border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent rounded-lg">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {service.category}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {service.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Mulai dari</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(service.price_from)}
            </span>
          </div>
          <Button 
            variant="telegram" 
            size="sm"
            onClick={() => onOrder(service)}
            className="font-semibold"
          >
            Pesan Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}