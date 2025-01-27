"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useMemo } from "react";
import { ColDef } from "ag-grid-community";
import { Button } from "~/app/_components/ui/button";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/app/_components/ui/select";

export default function PackageManagementPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = parseInt(
    Array.isArray(params.packageId) ? params.packageId[0] : params.packageId,
    10,
  );

  const { data, isLoading, isError } = api.package.getUsersByPackage.useQuery({
    packageId,
  });

  const columnDefs = useMemo<
    ColDef<{ name: string; email: string; score: number }>[]
  >(
    () => [
      { headerName: "Name", field: "name", sortable: true, filter: true },
      { headerName: "Email", field: "email", sortable: true, filter: true },
      { headerName: "Score", field: "score", sortable: true, filter: true },
      {
        headerName: "Actions",
        cellRenderer: (params: any) => {
          const quizSessions = params.data.quizSession || [];
          return (
            <div className="flex size-full flex-col items-center justify-center gap-2">
              {quizSessions.length > 0 ? (
                <Select
                  onValueChange={(selectedSessionId) => {
                    if (selectedSessionId) {
                      router.push(
                        `/drill/admin/${packageId}/${selectedSessionId}?userId=${params.data.id}`,
                      );
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizSessions.map((session) => (
                      <SelectItem
                        key={session.id}
                        value={session.id.toString()}
                      >
                        {(() => {
                          switch (session.subtest.type) {
                            case "pu":
                              return "Kemampuan Penalaran Umum";
                            case "ppu":
                              return "Pengetahuan dan Pemahaman Umum";
                            case "pbm":
                              return "Kemampuan Memahami Bacaan dan Menulis";
                            case "pk":
                              return "Pengetahuan Kuantitatif";
                            case "lb":
                              return "Literasi Bahasa Indonesia dan Bahasa Inggris";
                            case "pm":
                              return "Penalaran Matematika";
                            default:
                              return session.subtest.type;
                          }
                        })()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span>No sessions</span>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!data) return <LoadingPage />;

  const rowData = data.map((user) => ({
    quizSession: user.quizSession,
    id: user.id,
    name: user.name || "Unnamed User",
    email: user.email || "N/A",
    score: user.score,
  }));

  return isError ? (
    <ErrorPage />
  ) : isLoading ? (
    <LoadingPage />
  ) : (
    <div className="ag-theme-alpine size-full h-[80vh]">
      <div className="mb-4 flex w-full items-center justify-between">
        <h1 className="text-xl font-bold">Package ID: {packageId}</h1>
        <div className="flex gap-4">
          <Select
            onValueChange={(selectedSessionId) => {
              if (selectedSessionId) {
                router.push(
                  `/packageManagement/${packageId}/edit/${selectedSessionId}`,
                );
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Edit Subtest" />
            </SelectTrigger>
            <SelectContent>
              {data
                .flatMap((user) => user.quizSession)
                .map((session) => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {(() => {
                      switch (session.subtest.type) {
                        case "pu":
                          return "Kemampuan Penalaran Umum";
                        case "ppu":
                          return "Pengetahuan dan Pemahaman Umum";
                        case "pbm":
                          return "Kemampuan Memahami Bacaan dan Menulis";
                        case "pk":
                          return "Pengetahuan Kuantitatif";
                        case "lb":
                          return "Literasi Bahasa Indonesia dan Bahasa Inggris";
                        case "pm":
                          return "Penalaran Matematika";
                        default:
                          return session.subtest.type;
                      }
                    })()}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => router.push(`/packageManagement/${packageId}/edit`)}
          >
            Edit All
          </Button>
        </div>
      </div>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={15}
      />
    </div>
  );
}
