"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { login } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const { token, user } = await login(values);
      setAuth(token, user);
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}`;
      router.push("/dashboard");
    } catch {
      setServerError("E-mail ou senha inválidos.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px]">
      {/* card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/60 px-8 py-10">

        {/* header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-[1.75rem] font-bold tracking-[-0.03em] leading-none text-slate-900">
              Procon Jacareí
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              Acesse o painel de gestão do chatbot
            </p>
          </div>
        </div>

        {/* divider */}
        <div className="mb-6 h-px bg-slate-100" />

        {/* form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">
                    E-mail
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-slate-400 transition-colors"
                      {...field}
                    />
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
                  <FormLabel className="text-slate-700 font-medium">
                    Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-slate-400 transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="mt-1 h-10 w-full rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* footer */}
      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Procon Jacareí · Prefeitura de Jacareí
      </p>
    </div>
  );
}
