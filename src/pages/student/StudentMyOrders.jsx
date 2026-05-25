// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import StudentOrderCard from "@/components/student/StudentOrderCard";
import { Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { orderGetMyStudentOrders } from "@/api/orderApi";

export default function StudentMyOrders() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    const { orders: data } = await orderGetMyStudentOrders({ limit: 100 });
    setOrders(data);
    setLoading(false);
  };

  // Compute stats from real data
  const filteredOrders = activeTab === "all"
    ? orders
    : activeTab === "active"
      ? orders.filter((o) => ["pending", "in_progress", "revision_requested", "delivered"].includes(o.status))
      : activeTab === "completed"
        ? orders.filter((o) => o.status === "completed")
        : orders.filter((o) => o.status === "awaiting_payment" || o.status === "pending");

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "awaiting_payment" || o.status === "pending").length,
    active: orders.filter((o) => ["in_progress", "revision_requested", "delivered"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

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
              <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
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
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-border p-1 h-auto rounded-xl">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                All Orders ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                Awaiting ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                In Progress ({stats.active})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
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
              <p className="text-muted-foreground mb-4">No orders in this category</p>
              <Link to="/gigs">
                <Button className="gap-2"><Plus className="w-4 h-4" /> Browse Gigs</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}