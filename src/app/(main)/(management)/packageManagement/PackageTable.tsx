import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Type } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "~/app/_components/ui/button";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { ColDef } from "ag-grid-community";

export default function PackageTable({
  packageData,
  refetchPackages,
}: {
  packageData: {
    type?: Type | null;
    name?: string | null;
    id?: number | null;
    classId?: number | null;
    TOstart?: string | Date | null;
    TOend?: string | Date | null;
  }[];
  refetchPackages: () => void;
}) {
  const router = useRouter();
  const { data: classes } = api.class.getAllClasses.useQuery();

  const deletePackageMutation = api.package.deletePackage.useMutation({
    onSuccess: () => {
      toast.success("Package deleted successfully!");
      refetchPackages();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete package.");
    },
  });

  const handleDelete = async (packageId: number) => {
    if (confirm("Are you sure you want to delete this package?")) {
      await deletePackageMutation.mutateAsync({ id: packageId });
    }
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        sortable: true,
        filter: true,
      },
      {
        field: "name",
        headerName: "Name",
        sortable: true,
        filter: true,
      },
      {
        field: "type",
        headerName: "Type",
        sortable: true,
        filter: true,
      },
      {
        field: "TOstart",
        headerName: "Start Date",
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toString() : "N/A",
      },
      {
        field: "TOend",
        headerName: "End Date",
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toString() : "N/A",
      },
      {
        field: "classId",
        headerName: "Class",
        filter: "agTextColumnFilter",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: [null, ...(classes?.map((classItem) => classItem.id) || [])],
        },
        valueFormatter: (params) => {
          if (!params.value) return "No Class";
          const classItem = classes?.find((c) => c.id === params.value);
          return classItem ? classItem.name : "";
        },
      },
      {
        headerName: "Actions",
        cellRenderer: (params: any) => {
          return (
            <div className="flex size-full items-center justify-center gap-2">
              <Button
                onClick={() =>
                  router.push(`/packageManagement/${params.data.id}`)
                }
              >
                Manage
              </Button>
              <Button
                variant="destructive"
                className="flex items-center"
                onClick={() => handleDelete(params.data.id!)}
              >
                <Trash2Icon />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, classes],
  );

  return (
    <div className="ag-theme-alpine size-full h-[80vh]">
      <AgGridReact
        rowData={packageData}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={15}
      />
    </div>
  );
}
