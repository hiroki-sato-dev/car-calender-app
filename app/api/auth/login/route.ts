import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "名前とパスワードを入力してください" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) {
    return NextResponse.json({ error: "名前またはパスワードが違います" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "名前またはパスワードが違います" }, { status: 401 });
  }

  const token = signToken({ userId: user.id, name: user.name });

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });

  return res;
}
