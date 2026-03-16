import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode, Shield, Zap, Package, Users, Calendar, AlertTriangle } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";

const DeveloperNotes = () => {
  return (
    <MainLayout>
      <div className="space-y-6 page-enter">
        <ScrollReveal variant="fade-up">
          <div>
            <h1>Developer's Notes</h1>
            <p className="text-muted-foreground">Technical documentation and system architecture</p>
          </div>
        </ScrollReveal>

        {/* Overview */}
        <ScrollReveal variant="fade-up" delay={100}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                TPAC OS is a comprehensive programme management system designed for field operations coordination. 
                The system handles event planning, gear inventory, participant management, itinerary scheduling, 
                and after-action reporting for organizational programmes.
              </p>
              <p className="text-sm text-muted-foreground mt-2 italic">
                by fittra syaifullah
              </p>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Core Features */}
        <ScrollReveal variant="fade-up" delay={150}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Core Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollRevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={100}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Programme Management</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and delete programmes with status tracking, multi-day support, 
                    and real-time updates via Supabase subscriptions.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Gear Inventory</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track gear with photos, quantities, conditions, and availability. 
                    Detect conflicts for overlapping programme dates.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Participant System</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invitation management with status tracking, role-based requirements, 
                    and profile management with contact info.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Itinerary & Reports</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Day-by-day scheduling, emergency contacts, and after-action report 
                    collection with ratings and feedback.
                  </p>
                </div>
              </ScrollRevealGroup>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Security & RLS */}
        <ScrollReveal variant="fade-right">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Row Level Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Events Table Policies</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Public read access for all events</li>
                  <li>✓ Users can create events (auto-assigned as creator)</li>
                  <li>✓ Only event creators can update their events</li>
                  <li>✓ All authenticated users can delete events</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Gear Table Policies</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Public read access for all gear</li>
                  <li>✓ Admins only for create/update/delete operations</li>
                  <li>✓ Uses <code className="bg-muted px-1 rounded">has_role()</code> function for permission checks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Audit Logging</h4>
                <p className="text-sm text-muted-foreground">
                  All access to sensitive data (profiles, clearances, relief contacts) is logged 
                  with IP addresses, timestamps, and accessed fields for security monitoring.
                </p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Role System */}
        <ScrollReveal variant="fade-left">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold">Available Roles</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <span>• President</span>
                  <span>• Vice-President</span>
                  <span>• Honorary Secretary</span>
                  <span>• Honorary Treasurer</span>
                  <span>• Training Heads</span>
                  <span>• Quartermaster</span>
                  <span>• Publicity Heads</span>
                  <span>• Member</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Admin roles (President, Vice-President) have elevated permissions for gear management, 
                  user management, and viewing all profiles and audit logs.
                </p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Future Enhancements */}
        <ScrollReveal variant="fade-right">
          <Card>
            <CardHeader>
              <CardTitle>Future Enhancements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>• Soft delete / archive functionality</span>
                <span>• Undo after delete feature</span>
                <span>• Bulk operations</span>
                <span>• Advanced search and filtering</span>
                <span>• Export functionality (PDF, CSV)</span>
                <span>• Calendar view for programmes</span>
                <span>• Mobile app version</span>
                <span>• Push notifications</span>
                <span>• Gear maintenance reminders</span>
                <span>• Analytics dashboard</span>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </MainLayout>
  );
};

export default DeveloperNotes;
