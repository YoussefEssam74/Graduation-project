"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { usersApi, authApi, type UpdateProfileDto } from "@/lib/api";
import {
  subscriptionApi,
  type UserSubscriptionDetailsDto,
} from "@/lib/api/subscription";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Mail,
  Shield,
  CreditCard,
  Activity,
  Bell,
  LogOut,
  ChevronRight,
  Save,
  Lock,
  Loader2,
  CheckCircle,
  Pause,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { Switch } from "@/components/ui/switch"; // Assuming you have this, or use standard checkbox

function ProfileContent() {
  const { user, logout, updateUserFields } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [subscription, setSubscription] =
    useState<UserSubscriptionDetailsDto | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [freezeDays, setFreezeDays] = useState(1);
  const [freezeStartDate, setFreezeStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isFreezing, setIsFreezing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [formData, setFormData] = useState<UpdateProfileDto>({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: 0,
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || 0,
        address: user.address || "",
      });
      setProfileImage(user.profileImageUrl || null);
    }
  }, [user]);

  // Fetch subscription data
  useEffect(() => {
    if (user?.userId) {
      const fetchSub = async () => {
        setSubLoading(true);
        try {
          const response = await subscriptionApi.getUserSubscription(
            user.userId,
          );
          if (response.success && response.data) {
            setSubscription(response.data);
          }
        } catch (err) {
          console.error("Failed to fetch subscription:", err);
        } finally {
          setSubLoading(false);
        }
      };
      fetchSub();
    }
  }, [user?.userId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCropComplete = useCallback((_: unknown, pixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const getCroppedImg = useCallback(async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise<void>((resolve) => { image.onload = () => resolve(); });
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("Canvas is empty")); }, "image/jpeg", 0.92);
    });
  }, []);

  const handleConfirmUpload = async () => {
    if (!previewImage || !user?.userId) return;
    setUploadingImage(true);
    try {
      const area = croppedAreaPixels;
      let fileToUpload: File;
      if (area) {
        const blob = await getCroppedImg(previewImage, area);
        fileToUpload = new File([blob], "profile.jpg", { type: "image/jpeg" });
      } else {
        fileToUpload = pendingFile!;
      }
      const response = await usersApi.uploadProfileImage(user.userId, fileToUpload);
      if (response.success && response.data) {
        setProfileImage(response.data.profileImageUrl);
        updateUserFields({ profileImageUrl: response.data.profileImageUrl });
        showToast("Profile image updated!", "success");
      } else {
        showToast(response.message || "Failed to upload image", "error");
      }
    } catch {
      showToast("Error uploading image", "error");
    } finally {
      setUploadingImage(false);
      setPreviewImage(null);
      setPendingFile(null);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast("Please enter your current password", "error");
      return;
    }
    if (!newPassword) {
      showToast("Please enter a new password", "error");
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      showToast("Password must be 8+ chars with uppercase, number, and special character", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      if (response.success) {
        showToast("Password changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        showToast(response.message || "Failed to change password", "error");
      }
    } catch {
      showToast("Error changing password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) return;
    setIsSaving(true);
    try {
      const response = await usersApi.updateProfile(user.userId, formData);
      if (response.success) {
        showToast("Profile updated successfully", "success");
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch {
      showToast("Error updating profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "physical", label: "Physical Stats", icon: Activity },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { id: "settings", label: "Settings", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Card */}
          <Card className="p-6 border-0 shadow-sm text-center bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-700 shadow-sm">
                <img
                  src={
                    profileImage ||
                    user?.profileImageUrl ||
                    "/placeholder-avatar.svg"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.onerror = null;
                    t.src = "/placeholder-avatar.svg";
                  }}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-md hover:bg-blue-700 transition space-x-0 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.name || "User"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
              {subscription?.planName || "No Plan"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {user?.address || ""}
            </p>
          </Card>

          {/* Navigation */}
          <Card className="p-4 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px] overflow-hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
                  />
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </nav>
          </Card>
          {/* QR Code Card */}
          <Card className="p-5 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px] text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Gym Check-In QR</p>
            <div className="flex justify-center mb-3">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={`MEMBER-${user?.userId}`}
                size={140}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
                className="rounded-lg"
              />
            </div>
            <button
              onClick={() => {
                const canvas = qrCanvasRef.current;
                if (!canvas) return;
                const link = document.createElement("a");
                link.download = `gym-qr-${user?.userId}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Download QR Code
            </button>
          </Card>        </div>

        {/* Right Content */}
        <div className="lg:col-span-9">
          {activeTab === "personal" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
                <Button
                  variant="ghost"
                  className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
                >
                  Edit Info
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Full Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth?.split("T")[0] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Gender
                  </label>
                  <Select
                    value={String(formData.gender)}
                    onValueChange={(v) =>
                      setFormData({ ...formData, gender: Number(v) })
                    }
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not Specified</SelectItem>
                      <SelectItem value="1">Male</SelectItem>
                      <SelectItem value="2">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Location
                  </label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="City, Country"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-6 font-bold text-slate-600 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "physical" && (
            <div className="space-y-6">
              <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Physical Stats
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Height
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      182{" "}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        cm
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Weight
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      85{" "}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        kg
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-center border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">
                      Goal
                    </p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      82{" "}
                      <span className="text-sm font-medium text-blue-400">
                        kg
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Medical Conditions / Injuries
                  </label>
                  <textarea
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    rows={4}
                    placeholder="List any injuries or medical conditions..."
                  />
                </div>
              </Card>

              <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Fitness Goals
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Muscle Gain",
                    "Endurance",
                    "Flexibility",
                    "Weight Loss",
                    "Stress Relief",
                    "Strength",
                  ].map((goal) => (
                    <span
                      key={goal}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "subscription" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px] relative overflow-hidden">
              {subLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : subscription ? (
                <>
                  <div className="absolute top-0 right-0 p-32 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Current Plan
                      </p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        {subscription.planName}
                      </h3>
                      {subscription.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          {subscription.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 mt-4">
                        {(() => {
                          try {
                            const features = JSON.parse(
                              subscription.features || "[]",
                            );
                            return (
                              Array.isArray(features) ? features : []
                            ).map((f: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                <span>{f}</span>
                              </div>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center mb-4 ml-auto">
                        <Shield className="h-6 w-6" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {subscription.price}{" "}
                        <span className="text-sm font-medium text-slate-500">
                          EGP
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${subscription.isFrozen ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : subscription.status === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}
                      >
                        {subscription.isFrozen ? "Frozen" : subscription.status}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Days Left
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {subscription.daysRemaining}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Start Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        End Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar for days remaining */}
                  {(() => {
                    const totalDays = Math.round(
                      (new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const progressPct = totalDays > 0 ? Math.min(100, (subscription.daysRemaining / totalDays) * 100) : 0;
                    return (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>Subscription Progress</span>
                          <span>{Math.round(progressPct)}% remaining</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progressPct > 30 ? "bg-green-500" : progressPct > 10 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Extra plan details */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {subscription.tokensIncluded > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Tokens Included</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{subscription.tokensIncluded} tokens</p>
                      </div>
                    )}
                    {subscription.maxBookingsPerDay != null && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Max Bookings/Day</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{subscription.maxBookingsPerDay}</p>
                      </div>
                    )}
                  </div>

                  {/* Freeze dialog */}
                  {showFreezeDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                          {subscription.isFrozen ? "Unfreeze Subscription" : "Freeze Subscription"}
                        </h3>
                        {!subscription.isFrozen && (
                          <>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                              Your subscription will be paused and the end date will be extended by the freeze duration.
                            </p>
                            <div className="mb-4">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                                Freeze Start Date
                              </label>
                              <Input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={freezeStartDate}
                                onChange={(e) => setFreezeStartDate(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                                Freeze Duration (days)
                                <span className="ml-2 text-blue-500 normal-case font-normal">
                                  Max: {subscription.maxFreezeDays} days
                                </span>
                              </label>
                              <Input
                                type="number"
                                min={1}
                                max={subscription.maxFreezeDays}
                                value={freezeDays}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setFreezeDays(Math.min(val, subscription.maxFreezeDays));
                                }}
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                              />
                              {freezeDays >= subscription.maxFreezeDays && (
                                <p className="text-xs text-amber-500 mt-1">Maximum freeze days for your plan reached.</p>
                              )}
                            </div>
                          </>
                        )}
                        {subscription.isFrozen && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Your subscription will resume immediately. The remaining freeze period will be cancelled.
                          </p>
                        )}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowFreezeDialog(false)}
                            className="flex-1 rounded-xl font-bold"
                            disabled={isFreezing}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              setIsFreezing(true);
                              try {
                                if (subscription.isFrozen) {
                                  await subscriptionApi.unfreezeSubscription(subscription.subscriptionId);
                                  showToast("Subscription unfrozen successfully", "success");
                                } else {
                                  await subscriptionApi.freezeSubscription(subscription.subscriptionId, freezeDays, freezeStartDate);
                                  showToast(`Subscription frozen for ${freezeDays} days`, "success");
                                }
                                setShowFreezeDialog(false);
                                // Reload subscription details
                                if (user?.userId) {
                                  const res = await subscriptionApi.getUserSubscription(user.userId);
                                  if (res.success && res.data) setSubscription(res.data);
                                }
                              } catch {
                                showToast("Failed to update subscription", "error");
                              } finally {
                                setIsFreezing(false);
                              }
                            }}
                            className={`flex-1 rounded-xl font-bold text-white ${subscription.isFrozen ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                            disabled={isFreezing}
                          >
                            {isFreezing ? <Loader2 className="h-4 w-4 animate-spin" /> : subscription.isFrozen ? "Unfreeze" : "Freeze"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowFreezeDialog(true)}
                      className={`rounded-xl font-bold h-10 px-4 ${subscription.isFrozen ? "border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" : "border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                    >
                      {subscription.isFrozen ? <><Play className="h-4 w-4 mr-2" />Unfreeze</> : <><Pause className="h-4 w-4 mr-2" />Freeze</>}
                    </Button>
                    <Button
                      onClick={() => router.push("/change-plan")}
                      className="rounded-xl font-bold h-10 px-6 bg-primary hover:bg-primary/90 text-white"
                    >
                      Change Plan
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Contact reception to subscribe to a plan.
                  </p>
                  <Button
                    onClick={() => router.push("/change-plan")}
                    className="rounded-xl font-bold h-10 px-6 bg-primary hover:bg-primary/90 text-white"
                  >
                    Browse Plans
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Security & Password
              </h3>

              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                  <p className="text-xs text-slate-400">Must contain uppercase, number, and special character</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl px-6 h-11 hover:bg-slate-800 dark:hover:bg-slate-600"
                >
                  {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : "Update Password"}
                </Button>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10 -m-6 -mt-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-600 dark:text-red-400 font-bold mb-1">
                      Delete Account
                    </h4>
                    <p className="text-xs text-red-400 dark:text-red-500">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 font-bold rounded-xl"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Preferences
              </h3>
              {/* Toggle items */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive updates about your progress
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      SMS Reminders
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get reminders for upcoming sessions
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Profile Picture Crop / Adjust Dialog */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Profile Photo</h3>
              <button
                onClick={() => { setPreviewImage(null); setPendingFile(null); }}
                disabled={uploadingImage}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xl leading-none disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <p className="px-5 pb-3 text-xs text-slate-500 dark:text-slate-400">Drag to pan · Pinch or use the slider to zoom</p>

            {/* Cropper */}
            <div className="relative w-full h-[300px] bg-slate-900">
              <Cropper
                image={previewImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div className="px-5 pt-4 pb-1 flex items-center gap-3">
              <span className="text-sm text-slate-400 select-none">−</span>
              <input
                type="range"
                aria-label="Zoom"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm text-slate-400 select-none">+</span>
            </div>

            {/* Buttons */}
            <div className="p-5 pt-3 flex gap-3">
              <button
                onClick={() => { setPreviewImage(null); setPendingFile(null); }}
                disabled={uploadingImage}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploadingImage}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {uploadingImage ? "Uploading…" : "Apply & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
