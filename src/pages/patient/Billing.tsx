import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Calendar, DollarSign } from "lucide-react";

interface Bill {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

export default function PatientBilling() {
  const [bills] = useState<Bill[]>([
    {
      id: "INV-001",
      date: "2024-01-15",
      description: "Consultation - Dr. Smith",
      amount: 150,
      status: "paid",
      dueDate: "2024-01-30"
    },
    {
      id: "INV-002", 
      date: "2024-01-10",
      description: "Blood Work - Lab Tests",
      amount: 85,
      status: "pending",
      dueDate: "2024-01-25"
    },
    {
      id: "INV-003",
      date: "2024-01-05",
      description: "X-Ray Imaging",
      amount: 120,
      status: "overdue",
      dueDate: "2024-01-20"
    },
    {
      id: "INV-004",
      date: "2023-12-28",
      description: "Annual Physical Exam",
      amount: 200,
      status: "paid",
      dueDate: "2024-01-12"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'default';
    }
  };

  const totalPending = bills
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">Billing & Payments</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {bills.filter(b => b.status !== 'paid').length} unpaid bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bills.filter(b => 
              new Date(b.date).getMonth() === new Date().getMonth()
            ).reduce((sum, bill) => sum + bill.amount, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">**** 4532</div>
            <p className="text-xs text-muted-foreground">
              Visa ending in 4532
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button className="bg-medical-primary hover:bg-medical-dark">
              <CreditCard className="mr-2 h-4 w-4" />
              Make Payment
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Statements
            </Button>
            <Button variant="outline">
              Update Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills and Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{bill.description}</div>
                      <div className="text-sm text-gray-500">
                        Invoice #{bill.id} • {new Date(bill.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">${bill.amount}</div>
                    <Badge variant={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                    {bill.status !== 'paid' && (
                      <Button size="sm" className="bg-medical-primary hover:bg-medical-dark">
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Insurance</label>
                <div className="p-3 border rounded">
                  <div className="font-medium">Blue Cross Blue Shield</div>
                  <div className="text-sm text-gray-500">Policy #: ABC123456789</div>
                  <div className="text-sm text-gray-500">Group #: XYZ987</div>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coverage Details</label>
                <div className="p-3 border rounded">
                  <div className="text-sm">
                    <div>Deductible: $500 (Met: $250)</div>
                    <div>Out-of-Pocket Max: $2000</div>
                    <div>Copay: $25 per visit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}