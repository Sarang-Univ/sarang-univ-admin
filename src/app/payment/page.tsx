import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentSummary } from "@/components/PaymentSummary";
import { MealAccommodationTable } from "@/components/MealAccommodationTable";
import { RegistrationTable } from "@/components/RegistrationTable";
import { AccountStatus } from "@/components/AccountStatus";
import { TransactionSummary } from "@/components/TransactionSummary";

export default function PaymentPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">입금 조회</h1>

      <PaymentSummary />

      <TransactionSummary />

      <MealAccommodationTable />

      <Tabs defaultValue="1">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="1">1부</TabsTrigger>
          <TabsTrigger value="2">2부</TabsTrigger>
          <TabsTrigger value="3">3부</TabsTrigger>
          <TabsTrigger value="4">4부</TabsTrigger>
          <TabsTrigger value="5">5부</TabsTrigger>
          <TabsTrigger value="6">6부</TabsTrigger>
          <TabsTrigger value="7">7부</TabsTrigger>
          <TabsTrigger value="8">8부</TabsTrigger>
        </TabsList>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(department => (
          <TabsContent key={department} value={department.toString()}>
            <RegistrationTable department={department} />
          </TabsContent>
        ))}
      </Tabs>

      <AccountStatus />
    </div>
  );
}
