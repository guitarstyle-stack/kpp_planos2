import React from 'react';

interface LoginCardProps {
    loginUrl: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({ loginUrl }) => {
    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

            {/* Card */}
            <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                <div className="relative p-8 sm:p-10">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-50"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-3xl font-bold text-white">P</span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        ยินดีต้อนรับ
                    </h2>
                    <p className="text-purple-200 text-center text-sm mb-8 leading-relaxed">
                        ระบบบริหารจัดการแผนและโครงการ<br />
                        <span className="text-xs text-purple-300/70">Plan and Project Management System</span>
                    </p>

                    {/* Login Button */}
                    <a
                        href={loginUrl}
                        className="group/btn relative w-full inline-flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold text-white transition-all duration-200 rounded-xl overflow-hidden"
                    >
                        {/* Button Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-200 group-hover/btn:scale-105"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"></div>

                        {/* Button Content */}
                        <div className="relative flex items-center gap-3">
                            {/* LINE Icon */}
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.258 9.61C22.258 5.75 17.66 2.62 12 2.62C6.34 2.62 1.742 5.75 1.742 9.61C1.742 12.87 4.07 15.65 7.64 16.32C7.94 16.42 8 16.51 8.05 16.71C8.11 16.92 8.04 17.22 8 17.41C7.97 17.57 7.77 18.59 7.74 18.77C7.62 19.34 7.51 19.95 8.02 20.21C8.53 20.47 9.21 20.08 9.63 19.82C10.74 19.14 15.28 16.42 17.26 15.25C20.31 13.92 22.258 11.89 22.258 9.61Z" />
                            </svg>
                            <span>เข้าสู่ระบบด้วย LINE</span>
                        </div>
                    </a>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 text-purple-200/60 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        <span>Enterprise Grade Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
