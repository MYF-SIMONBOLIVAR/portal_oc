import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formData, setFormData] = useState({
    nit: "",
    razonSocial: "",
    email: "",
    celular: "",
    password: "",
  });
  const [editFormData, setEditFormData] = useState({
    razonSocial: "",
    email: "",
    celular: "",
    telefono: "",
    ciudad: "",
    direccion: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Obtener lista de proveedores
  const { data: providers = [], isLoading, refetch } = trpc.admin.getAllProviders.useQuery();

  const createProviderMutation = trpc.admin.createProvider.useMutation({
    onSuccess: () => {
      setSuccess("Proveedor creado exitosamente");
      setFormData({
        nit: "",
        razonSocial: "",
        email: "",
        celular: "",
        password: "",
      });
      setIsOpen(false);
      refetch();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(err.message || "Error al crear proveedor");
    },
  });

  const updateProviderMutation = trpc.admin.updateProvider.useMutation({
    onSuccess: () => {
      setSuccess("Proveedor actualizado exitosamente");
      setIsEditOpen(false);
      setEditingProvider(null);
      refetch();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(err.message || "Error al actualizar proveedor");
    },
  });

  const deleteProviderMutation = trpc.admin.deleteProvider.useMutation({
    onSuccess: () => {
      setSuccess("Proveedor desactivado exitosamente");
      refetch();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(err.message || "Error al desactivar proveedor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nit || !formData.razonSocial || !formData.email || !formData.celular || !formData.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (formData.celular.length !== 10) {
      setError("El celular debe tener 10 dígitos");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    createProviderMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editFormData.razonSocial || !editFormData.email || !editFormData.celular) {
      setError("Por favor completa los campos requeridos");
      return;
    }

    if (editFormData.celular.length !== 10) {
      setError("El celular debe tener 10 dígitos");
      return;
    }

    updateProviderMutation.mutate({
      id: editingProvider.id,
      ...editFormData,
    });
  };

  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    setEditFormData({
      razonSocial: provider.razonSocial,
      email: provider.email,
      celular: provider.celular,
      telefono: provider.telefono || "",
      ciudad: provider.ciudad || "",
      direccion: provider.direccion || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (providerId: number) => {
    if (confirm("¿Estás seguro de que deseas desactivar este proveedor?")) {
      deleteProviderMutation.mutate({ id: providerId });
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === "activo") {
      return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inactivo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#19287F' }}>Administrador de Usuarios</h1>
          <p className="text-gray-600 mt-1">Gestiona proveedores y sus accesos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: '#19287F' }} className="hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo proveedor
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nit">NIT</Label>
                  <Input
                    id="nit"
                    placeholder="Ej: 900296641"
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    placeholder="10 dígitos"
                    maxLength={10}
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  placeholder="Nombre de la empresa"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" style={{ backgroundColor: '#19287F' }} className="text-white hover:opacity-90">
                  Crear Proveedor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-300">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Diálogo de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>
              Actualiza los datos del proveedor
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nit">NIT (No editable)</Label>
                <Input
                  id="edit-nit"
                  value={editingProvider?.nit || ""}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-celular">Celular</Label>
                <Input
                  id="edit-celular"
                  placeholder="10 dígitos"
                  maxLength={10}
                  value={editFormData.celular}
                  onChange={(e) => setEditFormData({ ...editFormData, celular: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-razonSocial">Razón Social</Label>
              <Input
                id="edit-razonSocial"
                placeholder="Nombre de la empresa"
                value={editFormData.razonSocial}
                onChange={(e) => setEditFormData({ ...editFormData, razonSocial: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="correo@empresa.com"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  placeholder="Teléfono fijo"
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ciudad">Ciudad</Label>
                <Input
                  id="edit-ciudad"
                  placeholder="Ciudad"
                  value={editFormData.ciudad}
                  onChange={(e) => setEditFormData({ ...editFormData, ciudad: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                placeholder="Dirección de la empresa"
                value={editFormData.direccion}
                onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" style={{ backgroundColor: '#19287F' }} className="text-white hover:opacity-90">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabla de Proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Proveedores Registrados</CardTitle>
          <CardDescription>
            Lista de todos los proveedores del sistema ({providers.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#19287F' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#19287F' }} className="text-white">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">NIT</th>
                    <th className="px-6 py-3 text-left font-medium">Razón Social</th>
                    <th className="px-6 py-3 text-left font-medium">Correo</th>
                    <th className="px-6 py-3 text-left font-medium">Celular</th>
                    <th className="px-6 py-3 text-left font-medium">Estado</th>
                    <th className="px-6 py-3 text-left font-medium">Fecha Registro</th>
                    <th className="px-6 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.length === 0 ? (
                    <tr className="border-b hover:bg-gray-50">
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hay proveedores registrados
                      </td>
                    </tr>
                  ) : (
                    providers.map((provider: any) => (
                      <tr key={provider.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium">{provider.nit}</td>
                        <td className="px-6 py-3">{provider.razonSocial}</td>
                        <td className="px-6 py-3">{provider.email}</td>
                        <td className="px-6 py-3">{provider.celular}</td>
                        <td className="px-6 py-3">{getEstadoBadge(provider.estado)}</td>
                        <td className="px-6 py-3">{formatDate(provider.createdAt)}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-blue-50"
                              onClick={() => handleEdit(provider)}
                              title="Editar proveedor"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 text-red-600"
                              onClick={() => handleDelete(provider.id)}
                              title="Desactivar proveedor"
                              disabled={provider.estado === "inactivo"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
