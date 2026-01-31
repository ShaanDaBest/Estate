import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, FileText, MapPin, AlertCircle, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyNote = {
  appointment_id: "",
  property_address: "",
  notes: "",
  follow_up_required: false,
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState(emptyNote);
  const [loading, setLoading] = useState(true);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, apptsRes] = await Promise.all([
        axios.get(`${API}/notes`),
        axios.get(`${API}/appointments?date=${dateStr}`),
      ]);
      setNotes(notesRes.data);
      setAppointments(apptsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData(note);
    } else {
      setEditingNote(null);
      setFormData(emptyNote);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setFormData(emptyNote);
  };

  const handleAppointmentSelect = (apptId) => {
    const appt = appointments.find((a) => a.id === apptId);
    if (appt) {
      setFormData({
        ...formData,
        appointment_id: apptId,
        property_address: appt.property_address,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await axios.put(`${API}/notes/${editingNote.id}`, formData);
        toast.success("Note updated");
      } else {
        await axios.post(`${API}/notes`, formData);
        toast.success("Note added");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save note");
    }
  };

  const handleDelete = async () => {
    if (!editingNote) return;
    try {
      await axios.delete(`${API}/notes/${editingNote.id}`);
      toast.success("Note deleted");
      setIsDeleteDialogOpen(false);
      setEditingNote(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const followUpNotes = filteredNotes.filter((n) => n.follow_up_required);
  const regularNotes = filteredNotes.filter((n) => !n.follow_up_required);

  return (
    <div data-testid="notes-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">House Notes</h1>
          <p className="page-subtitle">Property-specific notes for each visit</p>
        </div>
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="notes-date-picker">
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
            data-testid="add-note-btn"
          >
            <Plus size={16} />
            Add Note
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-luxury"
            data-testid="search-notes-input"
          />
        </div>
      </div>

      {/* Follow-up Required Section */}
      {followUpNotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            Follow-up Required ({followUpNotes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followUpNotes.map((note) => (
              <Card
                key={note.id}
                className="card-luxury border-l-4 border-l-amber-500"
                data-testid={`follow-up-note-${note.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#D3AF37]" />
                      <h3 className="font-medium">{note.property_address}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(note)}
                        data-testid={`edit-note-${note.id}`}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNote(note);
                          setIsDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-note-${note.id}`}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                    {note.notes}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className="badge-urgent">Follow-up Required</Badge>
                    <span className="text-xs text-neutral-400">
                      {format(new Date(note.updated_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      ) : regularNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularNotes.map((note) => (
            <Card
              key={note.id}
              className="card-luxury card-hover"
              data-testid={`note-card-${note.id}`}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D3AF37]/10 flex items-center justify-center">
                      <FileText size={14} className="text-[#D3AF37]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm line-clamp-1">{note.property_address}</h3>
                      <span className="text-xs text-neutral-400">
                        {format(new Date(note.updated_at), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(note)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(note);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 line-clamp-4 whitespace-pre-wrap">
                  {note.notes}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotes.length === 0 && followUpNotes.length === 0 ? (
        <Card className="card-luxury">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="text-neutral-400" size={24} />
            </div>
            <h3 className="font-medium text-lg mb-1">No notes yet</h3>
            <p className="text-neutral-500 text-sm mb-4">
              Add notes about properties you've visited
            </p>
            <Button className="btn-gold" onClick={() => handleOpenDialog()}>
              Add Note
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="note-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingNote ? "Edit Note" : "Add House Note"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {!editingNote && appointments.length > 0 && (
                <div className="form-group">
                  <Label className="form-label">Link to Appointment (Optional)</Label>
                  <Select
                    value={formData.appointment_id}
                    onValueChange={handleAppointmentSelect}
                  >
                    <SelectTrigger className="input-luxury" data-testid="note-appt-select">
                      <SelectValue placeholder="Select appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments.map((appt) => (
                        <SelectItem key={appt.id} value={appt.id}>
                          {appt.property_address} - {appt.start_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="form-group">
                <Label className="form-label">Property Address</Label>
                <Input
                  value={formData.property_address}
                  onChange={(e) =>
                    setFormData({ ...formData, property_address: e.target.value })
                  }
                  className="input-luxury"
                  placeholder="123 Main St, City"
                  required
                  data-testid="note-address-input"
                />
              </div>

              <div className="form-group">
                <Label className="form-label">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input-luxury min-h-[150px] resize-none"
                  placeholder="Enter your notes about this property..."
                  required
                  data-testid="note-content-input"
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-amber-50 border border-amber-100">
                <div>
                  <Label className="text-sm font-medium text-amber-800">
                    Follow-up Required
                  </Label>
                  <p className="text-xs text-amber-600">
                    Mark if this property needs follow-up
                  </p>
                </div>
                <Switch
                  checked={formData.follow_up_required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, follow_up_required: checked })
                  }
                  data-testid="note-followup-switch"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-note-btn">
                {editingNote ? "Update Note" : "Add Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-note-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-note-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
