import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PullToRefreshWrapper } from "@/components/layout/PullToRefreshWrapper";
import { DepartmentAlert } from "@/components/layout/DepartmentAlert";
import { getSession } from "@/lib/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const isTempDepartment = session?.user?.department?.code === "TEMP";

    return (
        <div className="drawer lg:drawer-open">
            <input id="main-drawer" type="checkbox" className="drawer-toggle" />

            {/* Drawer Content */}
            <div className="drawer-content flex flex-col min-h-screen bg-base-100">
                {/* Navbar */}
                <Navbar
                    userId={session?.user?.id}
                    userName={session?.user?.name}
                    userImage={session?.user?.image}
                />

                {isTempDepartment && (
                    <DepartmentAlert userName={session?.user?.name || "สมาชิก"} />
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-10 bg-base-200/50 pb-24 lg:pb-6">
                    <PullToRefreshWrapper>
                        <div className="mx-auto max-w-screen-2xl w-full space-y-6 md:space-y-8">
                            {children}
                        </div>
                    </PullToRefreshWrapper>
                </main>

                <Footer />

                {/* Bottom Navigation - Mobile Only */}
                <BottomNav />
            </div>

            {/* Drawer Side */}
            <div className="drawer-side z-50 overflow-visible">
                <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                <Sidebar />
            </div>
        </div>
    );
}
