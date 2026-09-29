import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const escolar = await prisma.category.upsert({
    where: { slug: "escolar" },
    update: {},
    create: { name: "Escolar", slug: "escolar" }
  });
  await prisma.product.createMany({
    data: [
      { name: "Caderno Universitário 10 matérias", slug: "caderno-10m", description: "Caderno capa dura com 200 folhas.", price: 29.9, imageUrl: "/placeholder.png", stock: 100, categoryId: escolar.id },
      { name: "Caneta Esferográfica Azul 1.0", slug: "caneta-azul-1-0", description: "Ponta média, escrita suave.", price: 2.5, imageUrl: "/placeholder.png", stock: 500, categoryId: escolar.id },
      { name: "Mochila Escolar Infantil", slug: "mochila-escolar", description: "Mochila resistente 30L.", price: 129.9, imageUrl: "/placeholder.png", stock: 50, categoryId: escolar.id }
    ]
  });
  console.log("Seed ok");
}

main().finally(() => prisma.$disconnect());
