import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota o servidor e só as dependências realmente usadas em .next/standalone,
  // para a imagem final não precisar carregar node_modules inteiro.
  output: "standalone",
};

export default nextConfig;
