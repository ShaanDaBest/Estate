import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, MapPin, Clock, Calendar, Home } from "lucide-react";
import { FaApple, FaAndroid } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import AddressInput from "@/components/AddressInput";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyAppointment = {
  client_id: "",
  property_address: "",
  city: "",
  date: format(new Date(), "yyyy-MM-dd"),
  start_time: "09:00",
  end_time: "10:00",
  time_at_house: 30,
  is_open_house: false,
  appointment_type: "private_viewing",
  house_status: "available",
};

const houseStatuses = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
  { value: "off_market", label: "Off Market" },
  { value: "open_house", label: "Open House" },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [formData, setFormData] = useState(emptyAppointment);
  const [loading, setLoading] = useState(true);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/appointments?date=${dateStr}`),
        axios.get(`${API}/clients`),
      ]);
      setAppointments(apptsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (appt = null) => {
    if (appt) {
      setEditingAppt(appt);
      setFormData(appt);
    } else {
      setEditingAppt(null);
      setFormData({ ...emptyAppointment, date: dateStr });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppt(null);
    setFormData({ ...emptyAppointment, date: dateStr });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppt) {
        await axios.put(`${API}/appointments/${editingAppt.id}`, formData);
        toast.success("Appointment updated");
      } else {
        await axios.post(`${API}/appointments`, formData);
        toast.success("Appointment created");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save appointment");
    }
  };

  const handleDelete = async () => {
    if (!editingAppt) return;
    try {
      await axios.delete(`${API}/appointments/${editingAppt.id}`);
      toast.success("Appointment deleted");
      setIsDeleteDialogOpen(false);
      setEditingAppt(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  };

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await axios.put(`${API}/appointments/${apptId}/status?status=${newStatus}`);
      toast.success("Status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getClientById = (id) => clients.find((c) => c.id === id);

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-100";
      case "sold": return "bg-blue-50 text-blue-700 border-blue-100";
      case "off_market": return "bg-neutral-50 text-neutral-700 border-neutral-100";
      case "open_house": return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-neutral-50 text-neutral-700 border-neutral-100";
    }
  };

  return (
    <div data-testid="appointments-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Schedule and manage property viewings</p>
        </div>
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="appt-date-picker">
                <Calendar size={16} />
                {format(selectedDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            className="btn-gold gap-2"
            onClick={() => handleOpenDialog()}
            data-testid="add-appointment-btn"
          >
            <Plus size={16} />
            Add Appointment
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const client = getClientById(appt.client_id);
            return (
              <Card
                key={appt.id}
                className="card-luxury card-hover"
                data-testid={`appointment-card-${appt.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Time and Order */}
                    <div className="flex items-start gap-4">
                      <div className="text-center">
                        <div className="font-mono text-lg font-semibold text-[#D3AF37]">
                          {appt.start_time}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {appt.time_at_house} min
                        </div>
                      </div>

                      <div className="w-px h-16 bg-neutral-200" />

                      {/* Main Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{client?.name || "Unknown Client"}</h3>
                          {client?.phone_type === "apple" ? (
                            <FaApple className="phone-apple" size={14} />
                          ) : client?.phone_type === "android" ? (
                            <FaAndroid className="phone-android" size={14} />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-600 mb-2">
                          <MapPin size={14} className="text-neutral-400" />
                          <span>{appt.property_address}, {appt.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={appt.is_open_house ? "badge-open-house" : "badge-private"}>
                            {appt.is_open_house ? "Open House" : "Private Viewing"}
                          </Badge>
                          <Select
                            value={appt.house_status}
                            onValueChange={(value) => handleStatusChange(appt.id, value)}
                          >
                            <SelectTrigger 
                              className={`h-6 px-2 text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(appt.house_status)}`}
                              data-testid={`status-select-${appt.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {houseStatuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(appt)}
                        data-testid={`edit-appt-${appt.id}`}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAppt(appt);
                          setIsDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-appt-${appt.id}`}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="card-luxury">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-neutral-400" size={24} />
            </div>
            <h3 className="font-medium text-lg mb-1">No appointments for {format(selectedDate, "MMM d")}</h3>
            <p className="text-neutral-500 text-sm mb-4">Schedule a viewing for this day</p>
            <Button className="btn-gold" onClick={() => handleOpenDialog()}>
              Add Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="appointment-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingAppt ? "Edit Appointment" : "New Appointment"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="form-group">
                <Label className="form-label">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required
                >
                  <SelectTrigger className="input-luxury" data-testid="appt-client-select">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.phone_type === "apple" ? (
                            <FaApple className="phone-apple" size={12} />
                          ) : (
                            <FaAndroid className="phone-android" size={12} />
                          )}
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label className="form-label">Property Address</Label>
                <Input
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  className="input-luxury"
                  placeholder="123 Main St"
                  required
                  data-testid="appt-address-input"
                />
              </div>

              <div className="form-group">
                <Label className="form-label">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-luxury"
                  placeholder="Los Angeles"
                  required
                  data-testid="appt-city-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <Label className="form-label">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-luxury"
                    required
                    data-testid="appt-date-input"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="input-luxury"
                    required
                    data-testid="appt-start-time-input"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input-luxury"
                    required
                    data-testid="appt-end-time-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label className="form-label">Time at House (min)</Label>
                  <Input
                    type="number"
                    value={formData.time_at_house}
                    onChange={(e) => setFormData({ ...formData, time_at_house: parseInt(e.target.value) || 30 })}
                    className="input-luxury"
                    min="5"
                    max="480"
                    data-testid="appt-time-at-house-input"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">House Status</Label>
                  <Select
                    value={formData.house_status}
                    onValueChange={(value) => setFormData({ ...formData, house_status: value })}
                  >
                    <SelectTrigger className="input-luxury" data-testid="appt-house-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {houseStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-4 bg-neutral-50">
                <div>
                  <Label className="text-sm font-medium">Open House</Label>
                  <p className="text-xs text-neutral-500">Mark as open house event</p>
                </div>
                <Switch
                  checked={formData.is_open_house}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_open_house: checked })}
                  data-testid="appt-open-house-switch"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-appointment-btn">
                {editingAppt ? "Update" : "Create Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-appt-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? Associated notes will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-appt-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
