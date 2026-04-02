"use client";
import { usePendingGroupLeaderRequests } from "@/lib/hooks/use-group-leader-requests";
import { useState } from "react";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Loader, AlertCircle } from "lucide-react";
import type { GroupLeaderRequestItem } from "@/types/group-leader-requests";

export function DepartmentHeadGroupLeaderRequestsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = usePendingGroupLeaderRequests({ page, search });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertCircle className="mb-2" />
        <div>Error loading requests: {error?.message || "Unknown error"}</div>
        <button className="btn btn-primary mt-4" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  type PendingGroupLeaderRequestRow = {
    firstName: string
    lastName: string
    email: string
    status: string
    createdAt: string
  }

  // Define columns for DataTable
  const columns: Column<PendingGroupLeaderRequestRow>[] = [
    { key: "name", header: "Name", render: (row) => `${row.firstName} ${row.lastName}` },
    { key: "email", header: "Email", render: (row) => row.email },
    { key: "status", header: "Status", render: (row) => row.status },
    { key: "createdAt", header: "Requested At", render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  const items: GroupLeaderRequestItem[] = data?.items ?? [];
  const pendingOnly = items.filter(i => (i.status ?? "").toUpperCase() === "PENDING");

  const rows: PendingGroupLeaderRequestRow[] = pendingOnly.map(i => ({
    firstName: i.student?.firstName ?? "",
    lastName: i.student?.lastName ?? "",
    email: i.student?.email ?? "",
    status: String(i.status ?? ""),
    createdAt: i.createdAt,
  }));

  const totalPages = data?.pagination?.pages || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pending Group Leader Requests</h1>
        <input
          className="input input-bordered"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <DataTable columns={columns} data={rows} />
      <div className="flex items-center justify-between mt-4">
        <button
          className="btn btn-outline"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          className="btn btn-outline"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
