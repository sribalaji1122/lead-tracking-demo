import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Architecture } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { data: architectures, isLoading } = useQuery<Architecture[]>({
    queryKey: ["/api/architectures"],
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Architecture History</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Architecture History</h1>
      </div>

      <div className="grid gap-6">
        {architectures?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No architectures found. Generate one to see it here.
            </CardContent>
          </Card>
        ) : (
          architectures?.map((arch) => (
            <Card key={arch.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl">{arch.companyName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generated on {format(new Date(arch.createdAt), "PPP p")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === arch.id ? null : arch.id)}
                >
                  {expandedId === arch.id ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  ID: {arch.id}
                </div>
                {expandedId === arch.id && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Technical Details</h3>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs max-h-96">
                      {JSON.stringify(arch.output, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
