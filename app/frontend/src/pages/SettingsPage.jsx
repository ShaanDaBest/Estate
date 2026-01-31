import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Settings, User, Bell, Clock, Palette, Smartphone, 
  Download, ExternalLink, Check, Moon, Sun, Save
} from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification preferences
    emailNotifications: true,
    appointmentReminders: true,
    dailySummary: false,
    reminderTime: "30", // minutes before
    
    // Working hours
    workStartTime: "09:00",
    workEndTime: "18:00",
    workDays: ["mon", "tue", "wed", "thu", "fri"],
    
    // Theme
    theme: "light",
  });

  useEffect(() => {
    fetchUser();
    fetchSettings();
    checkInstallStatus();
    
    // Listen for PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/user-settings`, {
        withCredentials: true,
      });
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      // Settings not found, use defaults
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/user-settings`, settings, {
        withCredentials: true,
      });
      toast.success("Settings saved successfully");
      
      // Apply theme
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const checkInstallStatus = () => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.info("App is already installed or not available for installation");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      toast.success("App installed successfully!");
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const toggleWorkDay = (day) => {
    setSettings((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const workDayOptions = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#D3AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="card-luxury" data-testid="profile-section">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="text-[#D3AF37]" size={20} />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details from Google</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#D3AF37]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#D3AF37] flex items-center justify-center">
                  <span className="text-white font-display text-2xl font-bold">
                    {user?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <Label className="form-label">Name</Label>
                  <Input
                    value={user?.name || ""}
                    disabled
                    className="input-luxury bg-neutral-100"
                    data-testid="profile-name"
                  />
                </div>
                <div>
                  <Label className="form-label">Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="input-luxury bg-neutral-100"
                    data-testid="profile-email"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">
              Profile information is managed through your Google account
            </p>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="card-luxury" data-testid="notifications-section">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Bell className="text-[#D3AF37]" size={20} />
              Notification Preferences
            </CardTitle>
            <CardDescription>Control how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-neutral-500">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
                data-testid="toggle-email-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Appointment Reminders</Label>
                <p className="text-xs text-neutral-500">Get reminded before appointments</p>
              </div>
              <Switch
                checked={settings.appointmentReminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, appointmentReminders: checked })
                }
                data-testid="toggle-appointment-reminders"
              />
            </div>
            {settings.appointmentReminders && (
              <div className="ml-4 pl-4 border-l-2 border-[#D3AF37]/30">
                <Label className="form-label">Reminder Time</Label>
                <Select
                  value={settings.reminderTime}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reminderTime: value })
                  }
                >
                  <SelectTrigger className="w-48" data-testid="reminder-time-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Daily Summary</Label>
                <p className="text-xs text-neutral-500">Receive daily schedule overview</p>
              </div>
              <Switch
                checked={settings.dailySummary}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, dailySummary: checked })
                }
                data-testid="toggle-daily-summary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="card-luxury" data-testid="working-hours-section">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="text-[#D3AF37]" size={20} />
              Default Working Hours
            </CardTitle>
            <CardDescription>Set your typical availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="form-label">Start Time</Label>
                <Input
                  type="time"
                  value={settings.workStartTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workStartTime: e.target.value })
                  }
                  className="input-luxury"
                  data-testid="work-start-time"
                />
              </div>
              <div>
                <Label className="form-label">End Time</Label>
                <Input
                  type="time"
                  value={settings.workEndTime}
                  onChange={(e) =>
                    setSettings({ ...settings, workEndTime: e.target.value })
                  }
                  className="input-luxury"
                  data-testid="work-end-time"
                />
              </div>
            </div>
            <div>
              <Label className="form-label mb-3 block">Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {workDayOptions.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleWorkDay(day.key)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      settings.workDays.includes(day.key)
                        ? "bg-[#D3AF37] text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                    data-testid={`workday-${day.key}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Preferences */}
        <Card className="card-luxury" data-testid="theme-section">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Palette className="text-[#D3AF37]" size={20} />
              Theme Preferences
            </CardTitle>
            <CardDescription>Customize the app appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, theme: "light" })}
                className={`p-4 border-2 transition-colors ${
                  settings.theme === "light"
                    ? "border-[#D3AF37] bg-[#D3AF37]/5"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
                data-testid="theme-light"
              >
                <div className="flex items-center justify-between mb-3">
                  <Sun size={24} className="text-amber-500" />
                  {settings.theme === "light" && (
                    <Check size={20} className="text-[#D3AF37]" />
                  )}
                </div>
                <p className="font-medium text-sm">Light Mode</p>
                <p className="text-xs text-neutral-500">Clean and bright interface</p>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: "dark" })}
                className={`p-4 border-2 transition-colors ${
                  settings.theme === "dark"
                    ? "border-[#D3AF37] bg-[#D3AF37]/5"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
                data-testid="theme-dark"
              >
                <div className="flex items-center justify-between mb-3">
                  <Moon size={24} className="text-indigo-500" />
                  {settings.theme === "dark" && (
                    <Check size={20} className="text-[#D3AF37]" />
                  )}
                </div>
                <p className="font-medium text-sm">Dark Mode</p>
                <p className="text-xs text-neutral-500">Easy on the eyes</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* App Version & Downloads */}
        <Card className="card-luxury" data-testid="app-version-section">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Smartphone className="text-[#D3AF37]" size={20} />
              Mobile App
            </CardTitle>
            <CardDescription>Get Estate Scheduler on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PWA Install */}
            <div className="p-4 bg-gradient-to-r from-[#D3AF37]/10 to-transparent border border-[#D3AF37]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#D3AF37] rounded-lg flex items-center justify-center">
                    <Download className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">Install Web App</h4>
                    <p className="text-xs text-neutral-500">
                      Add to your home screen for quick access
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleInstallPWA}
                  disabled={isInstalled}
                  className={isInstalled ? "bg-emerald-500" : "btn-gold"}
                  data-testid="install-pwa-btn"
                >
                  {isInstalled ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Installed
                    </>
                  ) : (
                    "Install"
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* App Store Links */}
            <div>
              <Label className="form-label mb-3 block">Native Mobile Apps</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-black text-white hover:bg-neutral-800 transition-colors"
                  data-testid="app-store-link"
                >
                  <FaApple size={32} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-80">
                      Download on the
                    </p>
                    <p className="font-semibold">App Store</p>
                  </div>
                  <ExternalLink size={16} className="ml-auto opacity-50" />
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-black text-white hover:bg-neutral-800 transition-colors"
                  data-testid="play-store-link"
                >
                  <FaGooglePlay size={28} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-80">
                      Get it on
                    </p>
                    <p className="font-semibold">Google Play</p>
                  </div>
                  <ExternalLink size={16} className="ml-auto opacity-50" />
                </a>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Native apps coming soon! Sign up for early access.
              </p>
            </div>

            <Separator />

            {/* Version Info */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-neutral-500">App Version</span>
                <Badge variant="outline" className="ml-2 font-mono">
                  v1.0.0
                </Badge>
              </div>
              <span className="text-xs text-neutral-400">
                © 2026 Estate Scheduler Pro
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="btn-gold gap-2 min-w-[150px]"
            data-testid="save-settings-btn"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
