import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/validations";
import { generateEmbedCode, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// LIST JOBS (admin/dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    const jobsWithCount = jobs.map((job) => ({
      ...job,
      applicationsCount: job._count.applications,
      _count: undefined,
    }));

    return NextResponse.json({
      jobs: jobsWithCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// CREATE JOB
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      } as any,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = user.role as any;
    const hasPermission = userRole?.permissions?.some(
      (rp: any) =>
        rp.permission.module === "jobs" &&
        rp.permission.action === "create" &&
        rp.granted,
    );

    if (!hasPermission && userRole?.name !== "Administrator") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // validate main fields
    const validatedData = jobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        ...validatedData,
        // 👇 ensure these optional fields actually hit the DB
        formId: body.formId || null,
        imageUrl: body.imageUrl || null,
        bannerImageUrl: body.bannerImageUrl || null,
        creatorId: user.id,
      },
    });

    const embedCode = generateEmbedCode(job.id);

    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: { embedCode },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true } },
      },
    });

    return NextResponse.json(updatedJob, { status: 201 });
  } catch (error) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
