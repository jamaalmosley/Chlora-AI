import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

export default function DoctorBilling() {
  const [billingData, setBillingData] = useState({
    monthlyRevenue: 15420,
    pendingPayments: 3240,
    totalPatients: 127,
    avgPerPatient: 121
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">Billing & Revenue</h1>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingData.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingData.pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From 23 invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +8 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Patient</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingData.avgPerPatient}</div>
            <p className="text-xs text-muted-foreground">
              Per visit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { patient: "John Smith", amount: 250, date: "2024-01-15", status: "paid" },
              { patient: "Sarah Johnson", amount: 180, date: "2024-01-14", status: "pending" },
              { patient: "Mike Brown", amount: 320, date: "2024-01-14", status: "paid" },
              { patient: "Emily Davis", amount: 150, date: "2024-01-13", status: "overdue" },
              { patient: "David Wilson", amount: 275, date: "2024-01-12", status: "paid" }
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">{transaction.patient}</div>
                  <div className="text-sm text-gray-500">{transaction.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">${transaction.amount}</span>
                  <Badge 
                    variant={
                      transaction.status === 'paid' ? 'default' : 
                      transaction.status === 'pending' ? 'secondary' : 'destructive'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}