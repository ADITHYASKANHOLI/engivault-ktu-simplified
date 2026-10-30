import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start") || undefined;
    const endDate = searchParams.get("end") || undefined;
    const format = searchParams.get("format"); // 'json' | 'csv'

    const report = await spaceService.getReports(startDate, endDate);

    if (format === "csv") {
      // Build a multi-section clean CSV report
      let csv = "FOLE SPACE USAGE REPORT\n";
      csv += `Generated At,${new Date().toISOString()}\n\n`;

      csv += "DAILY OPEN-SPACE SESSIONS\n";
      csv += "Date,Sessions,Unique Users,Avg Duration (Minutes)\n";
      report.dailySessions.forEach((d) => {
        csv += `"${d.date}",${d.count},${d.uniqueUsers},${d.avgDurationMinutes}\n`;
      });

      csv += "\nHOURLY DISTRIBUTION (PEAK HOURS)\n";
      csv += "Hour (24h IST),Session Starts\n";
      report.peakHours.forEach((h) => {
        csv += `${h.hour}:00,${h.count}\n`;
      });

      csv += "\nEVENT ATTENDANCE METRICS\n";
      csv += "Event Title,Starts At,Capacity,Registered,Checked In,Attendance Rate (%)\n";
      report.eventAttendance.forEach((e) => {
        csv += `"${e.title.replace(/"/g, '""')}","${e.startsAt}",${e.capacity},${e.registered},${e.checkedIn},${e.attendanceRate}\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fole-space-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Admin space reports error:", error);
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
