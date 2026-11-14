import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  FileCheck2,
  Users,
  ScrollText,
  Clock,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
  Info,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthz } from "@/lib/permissions";
import { toast } from "sonner";
import {
  fetchAnalyticsData,
  exportAnalyticsToCsv,
  type AnalyticsDataset,
} from "@/modules/analytics/analyticsData";

export default function AdminAnalytics() {
  const authz = useAuthz();
  const [days, setDays] = useState<number>(30);
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [data, setData] = useState<AnalyticsDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");

  const loadData = async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsData(selectedDays);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      toast.error("Failed to load analytics metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If in custom mode, fetch 180 days to give ample buffer for historical custom ranges
    const queryDays = rangeMode === "custom" ? 180 : days;
    loadData(queryDays);
  }, [days, rangeMode]);

  const handleRefresh = async () => {
    toast.info("Refreshing telemetry & application statistics...");
    await loadData(rangeMode === "custom" ? 180 : days);
    toast.success("Analytics metrics synchronized");
  };

  // Filtered dataset according to custom date range or preset
  const filteredData = useMemo<AnalyticsDataset | null>(() => {
    if (!data) return null;
    if (rangeMode === "preset") return data;

    const start = customStart;
    const end = customEnd;
    if (!start || !end || start > end) return data;

    const dailySubmissions = data.dailySubmissions.filter((d) => d.date >= start && d.date <= end);
    const dailyRegistrations = data.dailyRegistrations.filter((d) => d.date >= start && d.date <= end);
    const dailyCertificates = data.dailyCertificates.filter((d) => d.date >= start && d.date <= end);

    const totalSubmissions = dailySubmissions.reduce((acc, s) => acc + s.total, 0);
    const totalRegistrations = dailyRegistrations.reduce((acc, r) => acc + r.assistedOperators + r.cyberNodes, 0);
    const totalCertificatesGenerated = dailyCertificates.reduce((acc, c) => acc + c.issued, 0);

    return {
      ...data,
      summary: {
        ...data.summary,
        totalSubmissions,
        totalRegistrations,
        totalCertificatesGenerated,
      },
      dailySubmissions,
      dailyRegistrations,
      dailyCertificates,
    };
  }, [data, rangeMode, customStart, customEnd]);

  const handleExportCsv = () => {
    const targetDataset = filteredData || data;
    if (!targetDataset) {
      toast.error("No analytics data available to export");
      return;
    }
    const label = rangeMode === "custom" ? `${customStart}_to_${customEnd}` : `Last${days}Days`;
    const fileName = `Bagula2GP_Analytics_${label}.csv`;
    exportAnalyticsToCsv(targetDataset, fileName);
    toast.success(`CSV report (${label}) downloaded successfully`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border/80 bg-white/95 p-3 shadow-lg backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
          <p className="font-semibold text-foreground border-b border-border/40 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-muted-foreground">Bagula 2 No GP</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold font-mono text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const activeDataset = filteredData || data;

  // Filtered submission data based on service selection
  const filteredSubmissions = useMemo(() => {
    if (!activeDataset) return [];
    if (activeSubFilter === "warish") {
      return activeDataset.dailySubmissions.map((d) => ({ displayDate: d.displayDate, "Warish (Legal Heir)": d.warish }));
    }
    if (activeSubFilter === "dependent") {
      return activeDataset.dailySubmissions.map((d) => ({ displayDate: d.displayDate, "Dependent Certificate": d.dependent }));
    }
    if (activeSubFilter === "linkage") {
      return activeDataset.dailySubmissions.map((d) => ({ displayDate: d.displayDate, "Voter Linkage": d.linkage }));
    }
    if (activeSubFilter === "birth") {
      return activeDataset.dailySubmissions.map((d) => ({ displayDate: d.displayDate, "Birth Digitization": d.birth }));
    }
    return activeDataset.dailySubmissions.map((d) => ({
      displayDate: d.displayDate,
      "Warish (Legal Heir)": d.warish,
      "Dependent Certificate": d.dependent,
      "Voter Linkage": d.linkage,
      "Birth Digitization": d.birth,
      Total: d.total,
    }));
  }, [activeDataset, activeSubFilter]);

  const summary = activeDataset?.summary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BackButton fallbackUrl="/admin/dashboard" label="🏠 Dashboard" className="-ml-2 text-xs" />
              <Badge variant="outline" className="gap-1 text-[11px] font-normal border-primary/30 text-primary bg-primary/5">
                <ShieldCheck size={12} />
                Bagula 2 No GP Telemetry
              </Badge>
              {data?.isLive && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Live Sync
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              📈 Application Usage & Analytics Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Statistical breakdown of daily form submissions, Cyber Cafe &amp; DEO intake velocity, and certificate generation.
            </p>
          </div>

          {/* Controls: Date Range, Export, Refresh */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Select
              value={rangeMode === "custom" ? "custom" : String(days)}
              onValueChange={(v) => {
                if (v === "custom") {
                  setRangeMode("custom");
                } else {
                  setRangeMode("preset");
                  setDays(Number(v));
                }
              }}
            >
              <SelectTrigger className="w-[155px] h-9 text-xs bg-white">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="14">Last 14 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="custom">📅 Custom Date Range...</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-9 gap-1.5 text-xs bg-white shadow-xs"
              title="Refresh Telemetry Data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-primary" : "text-primary"} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleExportCsv}
              disabled={!activeDataset || loading}
              className="h-9 gap-1.5 text-xs shadow-xs"
              title="Export Current Visualization Data as CSV for Offline Reporting"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 text-xs bg-white shadow-xs"
              title="Print Summary Report"
            >
              <Printer size={13} className="text-muted-foreground" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>

        {/* Custom Date Range Toolbar (Visible when custom range is selected) */}
        {rangeMode === "custom" && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Custom Date Range Filter:</span>
              </span>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-[11px]">From:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-md border border-input bg-white px-2.5 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-[11px]">To:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-md border border-input bg-white px-2.5 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                {activeDataset?.dailySubmissions.length || 0} days selected
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] bg-white"
                onClick={() => {
                  setRangeMode("preset");
                  setDays(30);
                }}
              >
                Reset to 30 Days
              </Button>
            </div>
          </div>
        )}

        {/* Top KPI Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Form Submissions */}
          <Card className="border-border/50 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Submissions
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                <ScrollText size={16} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {loading ? "..." : summary?.totalSubmissions.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={13} />+{summary?.submissionGrowth}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Today's submissions:</span>
                <span className="font-semibold text-foreground font-mono">
                  {loading ? "..." : summary?.todaySubmissions}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Cyber Cafe & Assisted Sessions */}
          <Card className="border-border/50 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cyber &amp; Assisted Intake
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700">
                <Users size={16} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {loading ? "..." : summary?.totalRegistrations.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={13} />+{summary?.registrationGrowth}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>New today:</span>
                <span className="font-semibold text-foreground font-mono">
                  +{loading ? "..." : summary?.todayRegistrations} operators
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Certificates Generated */}
          <Card className="border-border/50 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Certificates Generated
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <FileCheck2 size={16} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {loading ? "..." : summary?.totalCertificatesGenerated.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
                  {summary?.approvalRate}% approval
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Generated today:</span>
                <span className="font-semibold text-foreground font-mono">
                  {loading ? "..." : summary?.todayCertificatesGenerated}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Turnaround & Queue */}
          <Card className="border-border/50 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Review & Turnaround
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock size={16} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {loading ? "..." : `${summary?.avgTurnaroundHours}h`}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Avg Cycle</span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Pending in queue:</span>
                <span className="font-semibold text-amber-600 font-mono">
                  {loading ? "..." : summary?.pendingReviewCount} apps
                </span>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Tabbed Analytics Explorers */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <TabsList className="bg-white/80 border border-border/40 p-1">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <BarChart3 size={13} />
                <span>Executive Overview</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs gap-1.5">
                <ScrollText size={13} />
                <span>Form Submissions</span>
              </TabsTrigger>
              <TabsTrigger value="registrations" className="text-xs gap-1.5">
                <Users size={13} />
                <span>Registrations</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs gap-1.5">
                <FileCheck2 size={13} />
                <span>Certificates Velocity</span>
              </TabsTrigger>
            </TabsList>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Data period: {rangeMode === "custom" ? `${customStart} to ${customEnd}` : `Past ${days} days`} ({activeDataset?.dailySubmissions[0]?.displayDate} – {activeDataset?.dailySubmissions[activeDataset?.dailySubmissions.length - 1]?.displayDate})
            </span>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 m-0">
            {/* Main Area Chart: Daily Submissions Trend */}
            <Card className="border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Daily Form Submissions Trend (Warish, Dependent, Linkage, Birth)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Continuous timeline of Cyber Cafe &amp; DEO submissions over {rangeMode === "custom" ? "the selected custom period" : `the past ${days} days`}.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                    Warish: {activeDataset?.serviceDistribution[0]?.count}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                    Dependent: {activeDataset?.serviceDistribution[1]?.count}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    Linkage: {activeDataset?.serviceDistribution[2]?.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeDataset?.dailySubmissions || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWarish" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorDependent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorLinkage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="warish"
                        name="Warish Certificate"
                        stroke="#0284c7"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorWarish)"
                      />
                      <Area
                        type="monotone"
                        dataKey="dependent"
                        name="Dependent Certificate"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDependent)"
                      />
                      <Area
                        type="monotone"
                        dataKey="linkage"
                        name="Voter Linkage"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLinkage)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Split Grid: Certificate Velocity vs Service Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Certificate Issuance & Approval Velocity */}
              <Card className="lg:col-span-7 border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileCheck2 size={16} className="text-emerald-600" />
                      Certificate Generation & Approval Velocity
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Issued vs Returned
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison of approved & issued certificates versus applications returned for correction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeDataset?.dailyCertificates || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        <Bar dataKey="approved" name="Approved & Generated" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="issued" name="Digitally Signed & Issued" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="returned" name="Returned for Correction" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Service Type Share (Donut / Pie) */}
              <Card className="lg:col-span-5 border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieChartIcon size={16} className="text-primary" />
                    Service Application Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Volume distribution across government services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeDataset?.serviceDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {(activeDataset?.serviceDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-2 text-xs">
                    {(activeDataset?.serviceDistribution || []).map((item) => (
                      <div key={item.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="truncate">
                          <p className="font-medium text-[11px] truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.count} ({item.percentage}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Geographic Village Distribution & Status Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Village Distribution */}
              <Card className="lg:col-span-6 border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    Geographic Distribution Across Gram Panchayat
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Application volume by Village / Ward in Bagula 2 No Gram Panchayat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activeDataset?.villageDistribution || []}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 45, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="village"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={95}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Applications" fill="#0284c7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Funnel */}
              <Card className="lg:col-span-6 border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers size={16} className="text-primary" />
                    Application Lifecycle & Clearance Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current stage of all applications received by the office.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(activeDataset?.statusFunnel || []).map((funnel) => {
                    const total = activeDataset?.summary.totalSubmissions || 1;
                    const pct = Math.min(100, Math.round((funnel.count / total) * 100));
                    return (
                      <div key={funnel.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: funnel.color }} />
                            {funnel.label}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {funnel.count.toLocaleString()} <span className="text-muted-foreground font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, pct)}%`, backgroundColor: funnel.color }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/[0.03] text-xs text-muted-foreground flex items-start gap-2 mt-4">
                    <Info size={14} className="text-primary shrink-0 mt-0.5" />
                    <span>
                      The average review turnaround for approved Warish and Dependent applications is{" "}
                      <strong className="text-foreground">{summary?.avgTurnaroundHours} hours</strong>. Return rate is{" "}
                      <strong className="text-foreground">
                        {summary?.totalSubmissions ? ((summary.returnedCount / summary.totalSubmissions) * 100).toFixed(1) : "2.4"}%
                      </strong>
                      , primarily due to illegible death certificates or missing voter EPIC card scans.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: DAILY FORM SUBMISSIONS */}
          <TabsContent value="submissions" className="space-y-6 m-0">
            <Card className="border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ScrollText size={16} className="text-primary" />
                    Form Submissions By Service & Intake Channel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Analyze daily application intake by service kind or submission source (Cyber Cafe Hub, DEO Counter, CSC Centers).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={activeSubFilter} onValueChange={setActiveSubFilter}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
                      <SelectValue placeholder="Filter Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services (Combined)</SelectItem>
                      <SelectItem value="warish">Warish (Legal Heir)</SelectItem>
                      <SelectItem value="dependent">Dependent Certificate</SelectItem>
                      <SelectItem value="linkage">Voter Linkage</SelectItem>
                      <SelectItem value="birth">Birth Digitization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredSubmissions} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      {activeSubFilter === "all" ? (
                        <>
                          <Bar dataKey="Warish (Legal Heir)" stackId="a" fill="#0284c7" />
                          <Bar dataKey="Dependent Certificate" stackId="a" fill="#8b5cf6" />
                          <Bar dataKey="Voter Linkage" stackId="a" fill="#10b981" />
                          <Bar dataKey="Birth Digitization" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </>
                      ) : activeSubFilter === "warish" ? (
                        <Bar dataKey="Warish (Legal Heir)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      ) : activeSubFilter === "dependent" ? (
                        <Bar dataKey="Dependent Certificate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      ) : activeSubFilter === "linkage" ? (
                        <Bar dataKey="Voter Linkage" fill="#10b981" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Bar dataKey="Birth Digitization" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Submission Intake Channels Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/40 bg-white/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Cyber Cafe Hub Direct</span>
                  <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700">Open Desk</Badge>
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">45%</p>
                <p className="text-[11px] text-muted-foreground">
                  Applications initiated through the open-access Cyber Cafe Hub without account barriers.
                </p>
              </Card>

              <Card className="border-border/40 bg-white/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">DEO Office Counter</span>
                  <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700">Counter Desk</Badge>
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">35%</p>
                <p className="text-[11px] text-muted-foreground">
                  In-office data entry operators assisting walk-in applicants and complex legal heir family trees.
                </p>
              </Card>

              <Card className="border-border/40 bg-white/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Cyber Cafe CSC Nodes</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">CSC Verified</Badge>
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">20%</p>
                <p className="text-[11px] text-muted-foreground">
                  Authorized village common service centers (Trust Media, Nayan Mondal CSC) processing high-res scans.
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: USER REGISTRATIONS */}
          <TabsContent value="registrations" className="space-y-6 m-0">
            <Card className="border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Daily Cyber Cafe Desk &amp; DEO Activity
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Total Logged: <strong className="text-foreground">{summary?.totalRegistrations} sessions</strong>
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Assisted desk operator intake vs authorized cyber cafe node onboarding over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeDataset?.dailyRegistrations || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="assistedOperators"
                        name="Assisted Desk Sessions"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cyberNodes"
                        name="New Cyber Cafe Nodes"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/40 bg-white/80 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Office DEO Verification &amp; Tiers
                </h3>
                <p className="text-xs text-muted-foreground">
                  All active Data Entry Operators operate under role-scoped certificate permissions and Super Admin daily quotas.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                    <Link to="/admin/profiles-directory?tab=deos">View DEO Directory</Link>
                  </Button>
                </div>
              </Card>

              <Card className="border-border/40 bg-white/80 p-4 space-y-2">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 size={14} className="text-primary" />
                  Cyber Cafe & CSC Node Network
                </h3>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">8 authorized Cyber Cafe centers</strong> operate across Bagula 2 No Gram Panchayat under daily quota caps (50 applications/day) with Super Admin audit logging.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                    <Link to="/admin/profiles-directory?tab=cyber">Manage Cyber Nodes</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: CERTIFICATE VELOCITY */}
          <TabsContent value="certificates" className="space-y-6 m-0">
            <Card className="border-border/40 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck2 size={16} className="text-emerald-600" />
                    Certificate Generation & Issuance Velocity
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                    High Efficiency
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily tracking of incoming submissions against issued certificates and returned applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeDataset?.dailyCertificates || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="submitted" name="Applications Received" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Certificates Approved" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="issued" name="Digitally Signed & Memo Issued" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick links to review register */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/[0.04]">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Need to review pending applications?</p>
                <p className="text-[11px] text-muted-foreground">
                  You have {summary?.pendingReviewCount} applications waiting in the supervisory queue.
                </p>
              </div>
              <Button asChild size="sm" className="h-8 text-xs font-semibold">
                <Link to="/admin/review?kind=warish&filter=waiting">
                  Go to Review Desk
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Daily Aggregated Log Table */}
        <Card className="border-border/40 bg-white/80 backdrop-blur-sm shadow-sm print:shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                Aggregated Daily Telemetry Log
              </CardTitle>
              <CardDescription className="text-xs">
                Audited daily breakdown of submissions, registrations, and certificate memo generations.
              </CardDescription>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Showing past {data?.dailySubmissions.length || 0} dates
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Warish</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Dependent</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Linkage</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total Submissions</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Assisted Desk</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Approved</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Issued Memo</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Returned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono text-[11px]">
                  {data?.dailySubmissions.slice().reverse().map((sub) => {
                    const reg = data.dailyRegistrations.find((r) => r.date === sub.date);
                    const cert = data.dailyCertificates.find((c) => c.date === sub.date);
                    return (
                      <tr key={sub.date} className="hover:bg-primary/[0.02] transition-colors">
                        <td className="py-2 px-4 font-sans font-medium text-foreground">
                          {sub.displayDate}
                        </td>
                        <td className="py-2 px-3 text-right text-sky-700">{sub.warish}</td>
                        <td className="py-2 px-3 text-right text-violet-700">{sub.dependent}</td>
                        <td className="py-2 px-3 text-right text-emerald-700">{sub.linkage}</td>
                        <td className="py-2 px-3 text-right font-bold text-foreground">{sub.total}</td>
                        <td className="py-2 px-3 text-right text-purple-700">+{reg?.assistedOperators || 0}</td>
                        <td className="py-2 px-3 text-right text-sky-600">{cert?.approved || 0}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{cert?.issued || 0}</td>
                        <td className="py-2 px-4 text-right text-rose-600">{cert?.returned || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
