// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import StudentOrderCard from "@/components/student/StudentOrderCard";
import { Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  filterOrdersByCategory,
  calculateOrderStats,
} from "@/utils/studentOrderUtils";

export default function StudentMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate loading orders
    const dummyOrders = [
      {
        id: "order-1",
        gig_id: "gig-001",
        gig_title: "Professional Logo Design",
        client_id: "client-001",
        client_name: "John Doe",
        package_name: "Standard",
        amount: 3000,
        delivery_days: 5,
        requirements:
          "Create a modern, minimalist logo for a tech startup. Should work well in both color and grayscale.",
        status: "awaiting_payment",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "order-2",
        gig_id: "gig-002",
        gig_title: "Website Banner Design",
        client_id: "client-002",
        client_name: "Jane Smith",
        package_name: "Premium",
        amount: 5000,
        delivery_days: 7,
        requirements:
          "Design a professional website banner (1200x300px) with hero imagery",
        status: "pending",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "order-3",
        gig_id: "gig-003",
        gig_title: "Business Card Design",
        client_id: "client-003",
        client_name: "Mike Johnson",
        package_name: "Basic",
        amount: 1500,
        delivery_days: 3,
        requirements: "Modern business card design with company details",
        status: "in_progress",
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "order-4",
        gig_id: "gig-004",
        gig_title: "Social Media Graphics",
        client_id: "client-004",
        client_name: "Sarah Lee",
        package_name: "Standard",
        amount: 3000,
        delivery_days: 5,
        requirements:
          "Create 10 Instagram posts with consistent branding and style",
        status: "delivered",
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "order-5",
        gig_id: "gig-005",
        gig_title: "Flyer Design",
        client_id: "client-005",
        client_name: "Tom Brown",
        package_name: "Premium",
        amount: 4000,
        delivery_days: 3,
        requirements: "A4 flyer design for event promotion",
        status: "revision_requested",
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: "order-6",
        gig_id: "gig-006",
        gig_title: "Packaging Design",
        client_id: "client-006",
        client_name: "Emma Wilson",
        package_name: "Premium",
        amount: 5000,
        delivery_days: 7,
        requirements:
          "Complete packaging design for cosmetics product (box, label, etc)",
        status: "completed",
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 432000000).toISOString(),
      },
    ];

    setOrders(dummyOrders);
    setLoading(false);
  }, []);

  const filterOrders = () => filterOrdersByCategory(orders, activeTab);

  const filteredOrders = filterOrders();
  const stats = calculateOrderStats(orders);

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Manage orders and track your work in progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">
                {stats.completed}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-border p-1 h-auto rounded-xl">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                All Orders ({stats.total})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Awaiting ({stats.pending})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                In Progress ({stats.active})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Completed ({stats.completed})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredOrders.map((order) => (
              <StudentOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No orders in this category
              </p>
              <Link to="/gigs">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Browse Gigs
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
