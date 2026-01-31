import { useState, useEffect } from "react";
import apiClient from "@/utils/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, Search } from "lucide-react";
import { FaApple, FaAndroid } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyClient = {
  name: "",
  phone: "",
  phone_type: "apple",
  email: "",
  current_address: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(emptyClient);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await apiClient.get(`/clients`);
      setClients(res.data);
    } catch (error) {
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData(emptyClient);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData(emptyClient);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await apiClient.put(`/clients/${editingClient.id}`, formData);
        toast.success("Client updated successfully");
      } else {
        await apiClient.post(`/clients`, formData);
        toast.success("Client added successfully");
      }
      handleCloseDialog();
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save client");
    }
  };

  const handleDelete = async () => {
    if (!editingClient) return;
    try {
      await apiClient.delete(`/clients/${editingClient.id}`);
      toast.success("Client deleted");
      setIsDeleteDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="clients-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client database</p>
        </div>
        <Button 
          className="btn-gold gap-2"
          onClick={() => handleOpenDialog()}
          data-testid="add-client-btn"
        >
          <Plus size={16} />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-luxury"
            data-testid="search-clients-input"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card 
              key={client.id} 
              className="card-luxury card-hover"
              data-testid={`client-card-${client.id}`}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="font-display text-lg font-semibold text-[#D3AF37]">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-base">{client.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {client.phone_type === "apple" ? (
                          <FaApple className="phone-apple" size={12} />
                        ) : (
                          <FaAndroid className="phone-android" size={12} />
                        )}
                        <span className="text-xs text-neutral-500">
                          {client.phone_type === "apple" ? "iMessage" : "Android"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(client)}
                      data-testid={`edit-client-${client.id}`}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingClient(client);
                        setIsDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-client-${client.id}`}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Phone size={14} className="text-neutral-400" />
                    <span className="font-mono">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Mail size={14} className="text-neutral-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-neutral-600">
                    <MapPin size={14} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{client.current_address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-luxury">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Plus className="text-neutral-400" size={24} />
            </div>
            <h3 className="font-medium text-lg mb-1">No clients yet</h3>
            <p className="text-neutral-500 text-sm mb-4">Add your first client to get started</p>
            <Button 
              className="btn-gold"
              onClick={() => handleOpenDialog()}
            >
              Add Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="client-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingClient ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="form-group">
                <Label className="form-label">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-luxury"
                  required
                  data-testid="client-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label className="form-label">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-luxury"
                    required
                    data-testid="client-phone-input"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Phone Type</Label>
                  <Select
                    value={formData.phone_type}
                    onValueChange={(value) => setFormData({ ...formData, phone_type: value })}
                  >
                    <SelectTrigger className="input-luxury" data-testid="client-phone-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apple">
                        <div className="flex items-center gap-2">
                          <FaApple className="phone-apple" />
                          Apple (iMessage)
                        </div>
                      </SelectItem>
                      <SelectItem value="android">
                        <div className="flex items-center gap-2">
                          <FaAndroid className="phone-android" />
                          Android
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="form-group">
                <Label className="form-label">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-luxury"
                  required
                  data-testid="client-email-input"
                />
              </div>

              <div className="form-group">
                <Label className="form-label">Current Address</Label>
                <Input
                  value={formData.current_address}
                  onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                  className="input-luxury"
                  required
                  data-testid="client-address-input"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-client-btn">
                {editingClient ? "Update" : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-client-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {editingClient?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-client-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
