import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Bulk archive/unarchive applications
export async function PATCH(request: NextRequest) {
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
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canArchive =
      user.role &&
      Array.isArray(user.role.permissions) &&
      user.role.permissions.some(
        (rp: any) =>
          rp.permission.module === "applications" &&
          rp.permission.action === "archive" &&
          rp.granted,
      );
    if (!canArchive && user.role?.name !== "Administrator") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { applicationIds, isArchived } = await request.json();

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      typeof isArchived !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (applicationIds.length === 0) {
      return NextResponse.json(
        { error: "No applications selected" },
        { status: 400 },
      );
    }

    // Update archive status for multiple applications
    const updatedApplications = await prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
        isArchived: !isArchived, // Only update if current state is different
      },
      data: {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        archivedBy: isArchived ? user.id : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${updatedApplications.count} application(s) ${isArchived ? "archived" : "unarchived"} successfully`,
      updatedCount: updatedApplications.count,
    });
  } catch (error) {
    console.error("Bulk archive applications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
