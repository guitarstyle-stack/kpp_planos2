import { aiService } from "@/services/aiService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faWandMagicSparkles, faChartLine, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export async function AIExecutiveBriefing({ stats }: { stats: any }) {
    // Generate briefing using AI
    // Note: In production, you might want to cache this result or fetch it via an API route to avoid blocking render too long
    // For now, we'll fetch it directly as it's a server component
    const { briefing, sentiment, highlights } = await aiService.generateExecutiveBriefing(stats);

    const getSentimentColor = () => {
        switch (sentiment) {
            case "POSITIVE": return "bg-success/10 text-success border-success/20";
            case "NEGATIVE": return "bg-error/10 text-error border-error/20";
            default: return "bg-info/10 text-info border-info/20";
        }
    };

    const getSentimentIcon = () => {
        switch (sentiment) {
            case "POSITIVE": return faChartLine;
            case "NEGATIVE": return faTriangleExclamation;
            default: return faRobot;
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-primary/20 overflow-hidden relative group">
            {/* Ambient Background Effect */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-all duration-700"></div>

            <div className="card-body relative z-10">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${getSentimentColor()} backdrop-blur-sm shadow-sm`}>
                        <FontAwesomeIcon icon={getSentimentIcon()} className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                AI Executive Briefing
                            </span>
                            <span className="badge badge-xs badge-ghost font-normal opacity-50">Beta</span>
                        </h3>

                        <p className="text-base leading-relaxed opacity-80 font-medium">
                            "{briefing}"
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {highlights.map((highlight, index) => (
                                <span key={index} className="badge badge-outline gap-1 pl-1 pr-3 py-3 h-auto">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
