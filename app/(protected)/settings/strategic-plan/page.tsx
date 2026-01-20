import { getAnnualPlans } from "@/services/developmentPlanService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faBullseye, faListCheck, faPlus, faTrash, faChevronRight, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { createIndicatorAction, deleteIndicatorAction } from "@/actions/developmentPlanActions";
import Link from "next/link";
import { StrategicPlanTree } from "./StrategicPlanTree";

export default async function StrategicPlanPage() {
    // Fetch full hierarchy
    const annualPlans = await getAnnualPlans();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการแผนยุทธศาสตร์ (Strategic Plans)</h1>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-0">
                    {/* Reusable Client Component for Tree Logic */}
                    <StrategicPlanTree initialPlans={annualPlans} />
                </div>
            </div>
        </div>
    );
}
