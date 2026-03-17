"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "名前とパスワードを入力してください" };
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return { error: "この名前はすでに使われています" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, passwordHash },
  });

  const token = signToken({ userId: user.id, name: user.name });
  await setAuthCookie(token);

  return { success: true };
}

export async function login(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "名前とパスワードを入力してください" };
  }

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) {
    return { error: "名前またはパスワードが違います" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "名前またはパスワードが違います" };
  }

  const token = signToken({ userId: user.id, name: user.name });
  await setAuthCookie(token);

  return { success: true };
}

export async function updateUserName(newName: string) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  if (!newName.trim()) return { error: "名前を入力してください" };

  const existing = await prisma.user.findUnique({ where: { name: newName } });
  if (existing) return { error: "この名前はすでに使われています" };

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: newName },
  });

  const token = signToken({ userId: user.id, name: user.name });
  await setAuthCookie(token);

  return { success: true, name: user.name };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return { success: true };
}
