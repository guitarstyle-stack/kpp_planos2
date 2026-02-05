'use client';

import { ResponsiveReportsList } from './ResponsiveReportsList';

interface ReportsListClientProps {
    reports: any[];
    isAdmin: boolean;
    userId?: number;
    userDepartmentId?: number;
}

export function ReportsListClient({ reports, isAdmin, userId, userDepartmentId }: ReportsListClientProps) {
    return (
        <ResponsiveReportsList
            reports={reports}
            isAdmin={isAdmin}
            userId={userId}
            userDepartmentId={userDepartmentId}
        />
    );
}
