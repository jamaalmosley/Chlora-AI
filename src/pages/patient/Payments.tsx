
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WalletCards } from "lucide-react";
import { toast } from "sonner";

// Mock billing data
const mockBillingHistory = [
  {
    id: "INV-001",
    date: "2025-04-15",
    description: "Hospital Stay - 3 days",
    amount: 2500.00,
    status: "paid",
    paidDate: "2025-04-20",
  },
  {
    id: "INV-002",
    date: "2025-04-01",
    description: "Lab Tests - Blood Work",
    amount: 350.50,
    status: "paid",
    paidDate: "2025-04-05",
  },
  {
    id: "INV-003",
    date: "2025-03-28",
    description: "Consultation - Dr. Smith",
    amount: 175.00,
    status: "pending",
    dueDate: "2025-04-30",
  },
  {
    id: "INV-004",
    date: "2025-03-22",
    description: "MRI Scan",
    amount: 850.00,
    status: "pending",
    dueDate: "2025-04-28",
  },
];

export default function PatientPayments() {
  const { user } = useAuth();
  const patient = mockPatients.find(p => p.id === user?.id) as Patient | undefined;
  const [selectedBills, setSelectedBills] = useState<string[]>([]);

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Billing & Payments</h1>
        <p>Loading billing data...</p>
      </div>
    );
  }

  const pendingBills = mockBillingHistory.filter(bill => bill.status === "pending");
  const paidBills = mockBillingHistory.filter(bill => bill.status === "paid");
  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  const toggleBillSelection = (id: string) => {
    setSelectedBills(prev => 
      prev.includes(id) 
        ? prev.filter(billId => billId !== id) 
        : [...prev, id]
    );
  };

  const selectedAmount = pendingBills
    .filter(bill => selectedBills.includes(bill.id))
    .reduce((sum, bill) => sum + bill.amount, 0);
  
  const handlePayment = () => {
    if (selectedBills.length === 0) {
      toast.error("Please select at least one bill to pay");
      return;
    }
    
    toast.success(`Processing payment of ${formatCurrency(selectedAmount)}`, {
      description: "Redirecting to payment gateway..."
    });
    
    // In a real app, this would redirect to a payment gateway
    setTimeout(() => {
      toast.info("This is a demo. In a real app, you would be redirected to a payment processor.");
    }, 2000);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Billing & Payments</h1>
        <p className="text-gray-600">
          View and manage your medical bills and payment history
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-medical-primary">{formatCurrency(totalDue)}</div>
            <p className="text-sm text-gray-500 mt-1">Due from {pendingBills.length} unpaid invoices</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-medical-primary hover:bg-medical-dark"
              onClick={handlePayment}
              disabled={selectedAmount === 0}
            >
              <WalletCards className="mr-2 h-4 w-4" />
              {selectedAmount > 0 
                ? `Pay Selected (${formatCurrency(selectedAmount)})` 
                : "Select Bills to Pay"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded mr-3">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M22 4H2v16h20V4zm-2 14H4V8h16v10z" />
                    <path d="M5 10h14v2H5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/2026</p>
                </div>
              </div>
              <Badge>Default</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Manage Payment Methods
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-medium">{patient.insuranceProvider || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Policy Number</p>
              <p className="font-medium">{patient.insuranceNumber || "Not specified"}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Update Insurance
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Bills</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {pendingBills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBills.map(bill => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            checked={selectedBills.includes(bill.id)}
                            onChange={() => toggleBillSelection(bill.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>{bill.id}</TableCell>
                        <TableCell>{formatDate(bill.date)}</TableCell>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>{formatDate(bill.dueDate || "")}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <WalletCards className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Pending Bills
                  </h3>
                  <p className="text-gray-500">
                    You don't have any outstanding bills to pay.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {paidBills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidBills.map(bill => (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.id}</TableCell>
                        <TableCell>{formatDate(bill.date)}</TableCell>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>{formatDate(bill.paidDate || "")}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Paid
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    No payment history found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
