import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        _count: { select: { applications: true } },

        // ✅ pull the assigned form + ordered fields in one go
        form: {
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // (Optional) hide non-public jobs from public pages:
    // if (job.status === "DRAFT" || job.status === "CLOSED") {
    //   return NextResponse.json({ error: "Job not found" }, { status: 404 });
    // }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
