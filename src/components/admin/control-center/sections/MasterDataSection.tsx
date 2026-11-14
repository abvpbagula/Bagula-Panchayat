import React from "react";
import { SecurityGovernanceCard } from "@/components/admin/SecurityGovernanceCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Database, Layers, ShieldCheck, FileCheck, Sliders, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export const MasterDataSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. The Authoritative Security Governance Configuration Card */}
      <SecurityGovernanceCard />

      {/* 2. Additional Master Data & Registry Shortcuts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-card">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Database className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">6 Registries</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Master Registries</CardTitle>
            <CardDescription className="text-xs">
              Mouzas, Wards, Hospitals, Occupations, and Panchayat Fees.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 rounded-xl gap-1.5">
              <Link to="/admin/master-data?tab=registries">
                <span>Manage Registries</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Sliders className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">Rules Engine</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Application Rules</CardTitle>
            <CardDescription className="text-xs">
              Delivery lead times, emergency thresholds, and auto-dispatch rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 rounded-xl gap-1.5">
              <Link to="/admin/master-data?tab=rules">
                <span>Configure Rules</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px]">Verification</Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">Signing Authority</CardTitle>
            <CardDescription className="text-xs">
              Pradhan & Executive Officer digital certificate signers and titles.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 rounded-xl gap-1.5">
              <Link to="/admin/master-data?tab=authority">
                <span>Authority Console</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
