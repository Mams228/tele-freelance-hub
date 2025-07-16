import { useState, useEffect } from 'react';
import { Order, Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, MessageSquare, Clock, ExternalLink, Settings, Plus } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useToast } from '@/hooks/use-toast';

export function AdminPanel() {
  const { getUserId } = useTelegram();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [workLink, setWorkLink] = useState('');
  const [newStatus, setNewStatus] = useState<Order['status']>('new');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Note: RLS context would be set in a real implementation

      // Check/create user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_user_id', getUserId())
        .single();

      if (!profile) {
        // Create profile for new user
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            telegram_user_id: getUserId(),
            name: 'Admin User',
            role: 'admin'
          })
          .select()
          .single();
        
        setUserProfile(newProfile as Profile);
      } else {
        setUserProfile(profile as Profile);
      }

      // Load orders with service details
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:services(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((ordersData || []) as Order[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data panel admin',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          work_notes: workNotes,
          work_link: workLink
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Status pesanan telah diperbarui'
      });

      setSelectedOrder(null);
      setWorkNotes('');
      setWorkLink('');
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status pesanan',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      new: 'default',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'destructive'
    } as const;

    const labels = {
      new: 'Baru',
      in_progress: 'Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };

    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has admin/freelancer access
  if (!userProfile || !['admin', 'freelancer'].includes(userProfile.role)) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="bg-warning/10 border-warning">
          <CardContent className="pt-6">
            <p className="text-center text-warning-foreground">
              Anda tidak memiliki akses ke panel admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-muted-foreground">
            Kelola pesanan dan layanan freelance
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 bg-success text-success-foreground">
          {userProfile.role === 'admin' ? 'Administrator' : 'Freelancer'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pesanan</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pesanan Baru</p>
                <p className="text-2xl font-bold text-warning">
                  {orders.filter(o => o.status === 'new').length}
                </p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Plus className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sedang Proses</p>
                <p className="text-2xl font-bold text-primary">
                  {orders.filter(o => o.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold text-success">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <User className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Daftar Pesanan
          </CardTitle>
          <CardDescription>
            Kelola dan update status pesanan pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.contact_info}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.service?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(order.service?.price_from || 0)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(order.deadline)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setWorkNotes(order.work_notes || '');
                              setWorkLink(order.work_link || '');
                              setNewStatus(order.status);
                            }}
                          >
                            Update
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Update Pesanan</DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-4">
                              {/* Order Details */}
                              <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Detail Pesanan</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Pelanggan:</span>
                                    <p className="font-medium">{selectedOrder.customer_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Layanan:</span>
                                    <p className="font-medium">{selectedOrder.service?.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Deadline:</span>
                                    <p className="font-medium">{formatDate(selectedOrder.deadline)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Kontak:</span>
                                    <p className="font-medium">{selectedOrder.contact_info}</p>
                                  </div>
                                </div>
                                {selectedOrder.notes && (
                                  <div className="mt-3">
                                    <span className="text-muted-foreground">Catatan:</span>
                                    <p className="text-sm mt-1">{selectedOrder.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Update Form */}
                              <div className="space-y-4">
                                <div>
                                  <Label>Status Pesanan</Label>
                                  <Select value={newStatus} onValueChange={(value: Order['status']) => setNewStatus(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">Baru</SelectItem>
                                      <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                                      <SelectItem value="completed">Selesai</SelectItem>
                                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="work_notes">Catatan Pekerjaan</Label>
                                  <Textarea
                                    id="work_notes"
                                    placeholder="Tambahkan update progress atau catatan untuk pelanggan..."
                                    value={workNotes}
                                    onChange={(e) => setWorkNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="work_link">Link Hasil Pekerjaan</Label>
                                  <Input
                                    id="work_link"
                                    placeholder="https://drive.google.com/... atau link preview hasil"
                                    value={workLink}
                                    onChange={(e) => setWorkLink(e.target.value)}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={updateOrderStatus}
                                    className="flex-1"
                                    variant="telegram"
                                  >
                                    Update Pesanan
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setSelectedOrder(null)}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Belum ada pesanan masuk</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}