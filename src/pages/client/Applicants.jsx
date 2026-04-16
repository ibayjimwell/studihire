// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Users,
  Briefcase,
  MessageSquare,
  DollarSign,
  Search,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Mail,
  MapPin,
  GraduationCap,
} from "lucide-react";

const sidebarLinks = [
  { href: "/client/projects", label: "My Projects", icon: Briefcase },
  { href: "/client/orders", label: "My Orders", icon: Briefcase },
  { href: "/client/applicants", label: "Applicants", icon: Users },
  { href: "/gigs", label: "Browse Gigs", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/client/payments", label: "Payments", icon: DollarSign },
];

const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export default function ClientApplicants() {
  const { user } = useCurrentUser();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Simulate loading applicants with dummy data
    const dummyApplicants = [
      {
        id: "applicant-1",
        student_id: "student-001",
        student_name: "Maria Garcia",
        email: "maria.garcia@email.com",
        avatar_url: null,
        rating: 4.8,
        total_reviews: 42,
        skills: ["UI Design", "Figma", "Prototyping"],
        location: "Manila, PH",
        bio: "Passionate UI/UX designer with 3+ years of experience",
        project_id: "project-001",
        project_title: "Mobile App UI Design",
        budget: "₱15,000 - ₱25,000",
        status: APPLICATION_STATUS.PENDING,
        applied_date: new Date(Date.now() - 86400000).toISOString(),
        cover_letter:
          "I'm very interested in this project. My experience in mobile design aligns perfectly with your requirements.",
      },
      {
        id: "applicant-2",
        student_id: "student-002",
        student_name: "John Smith",
        email: "john.smith@email.com",
        avatar_url: null,
        rating: 4.5,
        total_reviews: 28,
        skills: ["Web Development", "React", "Node.js"],
        location: "Cebu, PH",
        bio: "Full-stack developer specializing in modern web apps",
        project_id: "project-002",
        project_title: "E-commerce Website Development",
        budget: "₱30,000 - ₱50,000",
        status: APPLICATION_STATUS.PENDING,
        applied_date: new Date(Date.now() - 172800000).toISOString(),
        cover_letter:
          "I have successfully built 5+ e-commerce sites with React and Node.js. Ready to deliver quality work.",
      },
      {
        id: "applicant-3",
        student_id: "student-003",
        student_name: "Sarah Lee",
        email: "sarah.lee@email.com",
        avatar_url: null,
        rating: 4.9,
        total_reviews: 56,
        skills: ["Graphic Design", "Branding", "Illustration"],
        location: "Davao, PH",
        bio: "Award-winning graphic designer with passion for creative storytelling",
        project_id: "project-001",
        project_title: "Mobile App UI Design",
        budget: "₱15,000 - ₱25,000",
        status: APPLICATION_STATUS.ACCEPTED,
        applied_date: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        cover_letter:
          "Your project excites me! I've designed similar apps and would love to contribute.",
      },
      {
        id: "applicant-4",
        student_id: "student-004",
        student_name: "Mike Johnson",
        email: "mike.johnson@email.com",
        avatar_url: null,
        rating: 4.3,
        total_reviews: 18,
        skills: ["Video Editing", "Motion Graphics", "After Effects"],
        location: "Quezon City, PH",
        bio: "Creative video editor with modern aesthetic",
        project_id: "project-003",
        project_title: "Social Media Video Content",
        budget: "₱10,000 - ₱15,000",
        status: APPLICATION_STATUS.REJECTED,
        applied_date: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        cover_letter:
          "I can create engaging video content for your social media presence.",
      },
      {
        id: "applicant-5",
        student_id: "student-005",
        student_name: "Lisa Wong",
        email: "lisa.wong@email.com",
        avatar_url: null,
        rating: 4.7,
        total_reviews: 35,
        skills: ["Content Writing", "SEO", "Copywriting"],
        location: "BGC, Manila, PH",
        bio: "Content strategist and writer focused on conversion optimization",
        project_id: "project-002",
        project_title: "E-commerce Website Development",
        budget: "₱30,000 - ₱50,000",
        status: APPLICATION_STATUS.PENDING,
        applied_date: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        cover_letter:
          "Impressed with your project scope. I can handle content optimization and strategy.",
      },
      {
        id: "applicant-6",
        student_id: "student-006",
        student_name: "Carlos Reyes",
        email: "carlos.reyes@email.com",
        avatar_url: null,
        rating: 4.6,
        total_reviews: 32,
        skills: ["Mobile App Dev", "Flutter", "Firebase"],
        location: "Makati, PH",
        bio: "Mobile developer passionate about cross-platform solutions",
        project_id: "project-001",
        project_title: "Mobile App UI Design",
        budget: "₱15,000 - ₱25,000",
        status: APPLICATION_STATUS.PENDING,
        applied_date: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        cover_letter:
          "I can develop the mobile app based on the UI designs. Looking forward to collaborating!",
      },
    ];

    setApplicants(dummyApplicants);
    setLoading(false);
  }, []);

  const getFilteredApplicants = () => {
    if (filter === "all") return applicants;
    return applicants.filter((a) => a.status === filter);
  };

  const filteredApplicants = getFilteredApplicants();

  const stats = {
    total: applicants.length,
    pending: applicants.filter((a) => a.status === APPLICATION_STATUS.PENDING)
      .length,
    accepted: applicants.filter((a) => a.status === APPLICATION_STATUS.ACCEPTED)
      .length,
    rejected: applicants.filter((a) => a.status === APPLICATION_STATUS.REJECTED)
      .length,
  };

  const handleAccept = async (applicantId) => {
    setActionLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setApplicants((prev) =>
      prev.map((a) =>
        a.id === applicantId
          ? { ...a, status: APPLICATION_STATUS.ACCEPTED }
          : a,
      ),
    );

    if (selectedApplicant?.id === applicantId) {
      setSelectedApplicant((prev) => ({
        ...prev,
        status: APPLICATION_STATUS.ACCEPTED,
      }));
    }

    setActionLoading(false);
  };

  const handleReject = async (applicantId) => {
    setActionLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setApplicants((prev) =>
      prev.map((a) =>
        a.id === applicantId
          ? { ...a, status: APPLICATION_STATUS.REJECTED }
          : a,
      ),
    );

    if (selectedApplicant?.id === applicantId) {
      setSelectedApplicant((prev) => ({
        ...prev,
        status: APPLICATION_STATUS.REJECTED,
      }));
    }

    setActionLoading(false);
  };

  const getStatusBadge = (status) => {
    if (status === APPLICATION_STATUS.PENDING) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
          Pending
        </Badge>
      );
    }
    if (status === APPLICATION_STATUS.ACCEPTED) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          Accepted
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>
    );
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} sidebarTitle="Client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> My Applicants
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and review student applications to your projects.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.accepted}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground mt-1">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-white border border-border p-1 h-auto rounded-xl">
          <TabsTrigger
            value="all"
            className={`rounded-lg ${filter === "all" ? "bg-primary text-white" : ""}`}
          >
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger
            value={APPLICATION_STATUS.PENDING}
            className={`rounded-lg ${filter === APPLICATION_STATUS.PENDING ? "bg-primary text-white" : ""}`}
          >
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger
            value={APPLICATION_STATUS.ACCEPTED}
            className={`rounded-lg ${filter === APPLICATION_STATUS.ACCEPTED ? "bg-primary text-white" : ""}`}
          >
            Accepted ({stats.accepted})
          </TabsTrigger>
          <TabsTrigger
            value={APPLICATION_STATUS.REJECTED}
            className={`rounded-lg ${filter === APPLICATION_STATUS.REJECTED ? "bg-primary text-white" : ""}`}
          >
            Rejected ({stats.rejected})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applicant Cards */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">
          Loading...
        </div>
      ) : filteredApplicants.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No applicants found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplicants.map((applicant) => (
            <Card
              key={applicant.id}
              className="bg-white border-border hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Student Avatar */}
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarImage src={applicant.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {applicant.student_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Student & Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {applicant.student_name}
                        </h3>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {applicant.rating} ({applicant.total_reviews})
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        <span className="font-medium">Project:</span>{" "}
                        {applicant.project_title}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {applicant.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {applicant.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{applicant.skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Applied{" "}
                        {new Date(applicant.applied_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      {getStatusBadge(applicant.status)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setShowDetailDialog(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedApplicant?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedApplicant?.student_name[0]}
                </AvatarFallback>
              </Avatar>
              {selectedApplicant?.student_name}
            </DialogTitle>
            <DialogDescription>
              Applicant for: {selectedApplicant?.project_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating & Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Rating
                </p>
                <p className="text-lg font-bold flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {selectedApplicant?.rating} (
                  {selectedApplicant?.total_reviews} reviews)
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Email
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" /> {selectedApplicant?.email}
                </p>
              </div>
            </div>

            {/* Location & Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Location
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" /> {selectedApplicant?.location}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Status
                </p>
                {selectedApplicant && getStatusBadge(selectedApplicant.status)}
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Bio
              </p>
              <p className="text-sm text-foreground">
                {selectedApplicant?.bio}
              </p>
            </div>

            {/* Skills */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant?.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Cover Letter
              </p>
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3">
                  <p className="text-sm text-foreground">
                    {selectedApplicant?.cover_letter}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Project Budget */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">
                Project Budget
              </p>
              <p className="text-sm font-bold text-blue-900">
                {selectedApplicant?.budget}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedApplicant) {
                  handleReject(selectedApplicant.id);
                }
              }}
              disabled={
                actionLoading ||
                selectedApplicant?.status !== APPLICATION_STATUS.PENDING
              }
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading ? "Processing..." : "Reject"}
            </Button>
            <Button
              onClick={() => {
                if (selectedApplicant) {
                  handleAccept(selectedApplicant.id);
                }
              }}
              disabled={
                actionLoading ||
                selectedApplicant?.status !== APPLICATION_STATUS.PENDING
              }
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {actionLoading ? "Processing..." : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
