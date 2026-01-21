"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

interface NotificationStats {
    total: number;
    byType: {
        INFO: number;
        WARNING: number;
        SUCCESS: number;
        ERROR: number;
    };
    recentcount: number;
}

export function NotificationAnalytics({ stats }: { stats: NotificationStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stats shadow bg-info text-info-content">
                <div className="stat">
                    <div className="stat-figure text-info-content">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-3xl opacity-80" />
                    </div>
                    <div className="stat-title text-info-content opacity-90">Information</div>
                    <div className="stat-value">{stats.byType.INFO}</div>
                    <div className="stat-desc text-info-content opacity-80">แจ้งเตือนทั่วไป</div>
                </div>
            </div>

            <div className="stats shadow bg-warning text-warning-content">
                <div className="stat">
                    <div className="stat-figure text-warning-content">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl opacity-80" />
                    </div>
                    <div className="stat-title text-warning-content opacity-90">Warning</div>
                    <div className="stat-value">{stats.byType.WARNING}</div>
                    <div className="stat-desc text-warning-content opacity-80">แจ้งเตือนระวัง</div>
                </div>
            </div>

            <div className="stats shadow bg-success text-success-content">
                <div className="stat">
                    <div className="stat-figure text-success-content">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-3xl opacity-80" />
                    </div>
                    <div className="stat-title text-success-content opacity-90">Success</div>
                    <div className="stat-value">{stats.byType.SUCCESS}</div>
                    <div className="stat-desc text-success-content opacity-80">แจ้งเตือนสำเร็จ</div>
                </div>
            </div>

            <div className="stats shadow bg-error text-error-content">
                <div className="stat">
                    <div className="stat-figure text-error-content">
                        <FontAwesomeIcon icon={faTimesCircle} className="text-3xl opacity-80" />
                    </div>
                    <div className="stat-title text-error-content opacity-90">Error</div>
                    <div className="stat-value">{stats.byType.ERROR}</div>
                    <div className="stat-desc text-error-content opacity-80">แจ้งเตือนข้อผิดพลาด</div>
                </div>
            </div>
        </div>
    );
}
