import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { getSession } from "@/lib/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

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

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-10 bg-base-200/50 pb-20 lg:pb-6">
                    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
                        {children}
                    </div>
                </main>

                <Footer />

                {/* Bottom Navigation - Mobile Only */}
                <BottomNav />
            </div>

            {/* Drawer Side */}
            <div className="drawer-side z-50">
                <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                <Sidebar />
            </div>
        </div>
    );
}
