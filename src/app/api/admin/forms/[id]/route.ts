import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FieldType as PrismaFieldType } from "@prisma/client";

const ALLOWED = new Set<keyof typeof PrismaFieldType>([
  "TEXT",
  "EMAIL",
  "PHONE",
  "TEXTAREA",
  "SELECT",
  "RADIO",
  "CHECKBOX",
  "TAGS",
  "SKILLS",
  "FILE",
  "DATE",
  "NUMBER",
  "URL",
  "PASSWORD",
  "COUNTRY_CODE",
  "PAGE_BREAK",
]);

type FieldIn = {
  label: string;
  fieldType: string;
  placeholder?: string;
  options?: string[];
  cssClass?: string;
  fieldId?: string;
  fieldWidth?: string;
  isRequired?: boolean;
  order?: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

async function authUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("401");
  const decoded = verifyToken(auth.slice(7));
  if (!decoded || typeof decoded === "string") throw new Error("401");
  const me = await prisma.user.findUnique({
    where: { id: (decoded as any).userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  if (!me) throw new Error("404");
  const hasUpdate =
    me.role &&
    Array.isArray(me.role.permissions) &&
    me.role.permissions.some(
      (rp: any) =>
        rp.permission.module === "forms" &&
        rp.permission.action === "update" &&
        rp.granted,
    );
  if (!hasUpdate && me.role?.name !== "Administrator") throw new Error("403");
  return me;
}

async function doUpdate(formId: string, body: any) {
  const { name, description, isDefault, fields } = body as {
    name?: string;
    description?: string;
    isDefault?: boolean;
    fields?: FieldIn[];
  };
  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const clean = (Array.isArray(fields) ? fields : []).map((f, i) => {
    const key = String(
      f.fieldType || "",
    ).toUpperCase() as keyof typeof PrismaFieldType;
    if (!ALLOWED.has(key)) throw new Error(`Invalid fieldType: ${f.fieldType}`);
    const enumVal = PrismaFieldType[key];
    const label = (f.label || "Untitled").trim();
    const fieldId = (f.fieldId || "").trim();
    const fieldName =
      fieldId ||
      (enumVal === PrismaFieldType.PAGE_BREAK
        ? `page_break_${i}`
        : slugify(label || `field_${i}`));
    return {
      fieldName,
      fieldType: enumVal,
      label,
      placeholder: f.placeholder ?? null,
      options: Array.isArray(f.options)
        ? JSON.stringify(f.options.map(String))
        : null,
      cssClass: f.cssClass ?? null,
      fieldId: fieldId || null,
      fieldWidth: f.fieldWidth ?? "100%",
      isRequired: Boolean(f.isRequired),
      order: Number.isFinite(f.order as number) ? (f.order as number) : i,
    };
  });

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.form.updateMany({
        where: { isDefault: true, NOT: { id: formId } },
        data: { isDefault: false },
      });
    }
    await tx.formField.deleteMany({ where: { formId } });
    await tx.form.update({
      where: { id: formId },
      data: {
        name,
        description: description ?? null,
        isDefault: Boolean(isDefault),
      },
    });
    if (clean.length)
      await tx.formField.createMany({
        data: clean.map((cf) => ({ ...cf, formId })),
      });
    return tx.form.findUnique({
      where: { id: formId },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(updated);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await authUser(req);
    const body = await req.json();
    return doUpdate(params.id, body);
  } catch (e: any) {
    const code =
      e?.message === "401"
        ? 401
        : e?.message === "403"
          ? 403
          : e?.message === "404"
            ? 404
            : 500;
    return NextResponse.json(
      { error: code === 500 ? "Failed to update form" : "Unauthorized" },
      { status: code },
    );
  }
}

// 🔁 Accept POST to /api/admin/forms/:id as an update alias (avoids 405 from some clients)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await authUser(req);
    const body = await req.json();
    return doUpdate(params.id, body);
  } catch (e: any) {
    const code =
      e?.message === "401"
        ? 401
        : e?.message === "403"
          ? 403
          : e?.message === "404"
            ? 404
            : 500;
    return NextResponse.json(
      { error: code === 500 ? "Failed to update form" : "Unauthorized" },
      { status: code },
    );
  }
}

// ✅ Respond to preflight cleanly
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await authUser(req);
    await prisma.form.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 },
    );
  }
}
