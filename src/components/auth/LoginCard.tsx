import React from 'react';


interface LoginCardProps {
    loginUrl: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({ loginUrl }) => {
    return (

        <div className="card bg-base-100 w-full shadow-xl border border-base-300">
            <div className="card-body items-center text-center p-8">
                <div className="avatar placeholder mb-4">
                    <div className="bg-primary text-primary-content rounded-xl w-20 h-20 shadow-lg shadow-primary/30">
                        <span className="text-3xl font-bold">P</span>
                    </div>
                </div>

                <h2 className="card-title text-3xl font-bold mb-1">PlanOS</h2>
                <p className="text-sm opacity-60 mb-8 max-w-xs">
                    ระบบบริหารจัดการแผนและโครงการ<br />
                    Plan and Project Management System
                </p>

                <div className="card-actions w-full">
                    <a
                        href={loginUrl}
                        className="btn btn-lg btn-success text-white w-full gap-3 shadow-md hover:shadow-lg transition-all"
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.258 9.61C22.258 5.75 17.66 2.62 12 2.62C6.34 2.62 1.742 5.75 1.742 9.61C1.742 12.87 4.07 15.65 7.64 16.32C7.94 16.42 8 16.51 8.05 16.71C8.11 16.92 8.04 17.22 8 17.41C7.97 17.57 7.77 18.59 7.74 18.77C7.62 19.34 7.51 19.95 8.02 20.21C8.53 20.47 9.21 20.08 9.63 19.82C10.74 19.14 15.28 16.42 17.26 15.25C20.31 13.92 22.258 11.89 22.258 9.61ZM9.2 11.58H7.32V8.12H9.2V11.58ZM11.96 11.58H10.08V8.12H11.96V11.58ZM16.63 11.58H12.84V8.12H14.73V9.75H16.63V11.58ZM19.39 11.58H17.51V8.12H19.38V9.11H17.51V9.32H19.38V10.32H17.51V10.53H19.39V11.58Z" />
                        </svg>
                        เข้าสู่ระบบด้วย LINE
                    </a>
                </div>

                <div className="divider my-4"></div>

                <div className="flex items-center gap-2 justify-center opacity-50 text-xs text-base-content">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                    </svg>
                    Enterprise Grade Security
                </div>
            </div>
        </div>
    );
};
