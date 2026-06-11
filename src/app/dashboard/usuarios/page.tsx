"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/services/users";
import type { User, Role } from "@/types";

// --- Constants ---

const ROLE_LABELS: Record<Role, string> = {
  gestor: "Gestor",
  analista: "Analista",
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  gestor: "bg-purple-50 text-purple-700 border-purple-200",
  analista: "bg-green-50 text-green-700 border-green-200",
};

// --- Schemas ---

const baseFields = {
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["gestor", "analista"] as const, {
    error: "Selecione um cargo",
  }),
};

const createSchema = z.object({
  ...baseFields,
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

const editSchema = z.object(baseFields);

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// --- Dialog: criar usuário ---

function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: CreateUserPayload) => void;
  isPending: boolean;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "", role: "" as unknown as Role },
  });

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo usuário.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="create-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao@procon.sp.gov.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="analista">Analista</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            disabled={isPending}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Dialog: editar usuário ---

function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  user: User | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: UpdateUserPayload) => void;
  isPending: boolean;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: user
      ? { name: user.name, email: user.email, role: user.role }
      : { name: "", email: "", role: "" as unknown as Role },
  });

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Altere os dados do usuário selecionado.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="analista">Analista</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            disabled={isPending}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Dialog: confirmar remoção ---

function DeleteUserDialog({
  user,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  user: User | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{user?.name}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Página principal ---

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      toast.success("Usuário criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar usuário"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserToEdit(null);
      toast.success("Usuário atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar usuário"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserToDelete(null);
      toast.success("Usuário removido com sucesso");
    },
    onError: () => toast.error("Erro ao remover usuário"),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gerencie os usuários e seus cargos</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-700">Nenhum usuário cadastrado</p>
            <p className="mt-1 text-sm text-slate-400">Clique em "Novo usuário" para começar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="font-medium text-slate-600">Nome</TableHead>
                <TableHead className="font-medium text-slate-600">E-mail</TableHead>
                <TableHead className="font-medium text-slate-600">Cargo</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-100">
                  <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_BADGE_CLASS[user.role]}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setUserToEdit(user)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setUserToDelete(user)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isPending={createMutation.isPending}
      />

      <EditUserDialog
        user={userToEdit}
        onOpenChange={(v) => { if (!v) setUserToEdit(null); }}
        onSubmit={(values) => {
          if (userToEdit) updateMutation.mutate({ id: userToEdit.id, payload: values });
        }}
        isPending={updateMutation.isPending}
      />

      <DeleteUserDialog
        user={userToDelete}
        onOpenChange={(v) => { if (!v) setUserToDelete(null); }}
        onConfirm={() => {
          if (userToDelete) deleteMutation.mutate(userToDelete.id);
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
