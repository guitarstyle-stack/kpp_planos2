
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faLine, faTwitter } from "@fortawesome/free-brands-svg-icons";


export function Footer() {
    return (
        <footer className="footer footer-center p-6 bg-base-100/50 text-base-content border-t border-base-200 mt-auto">
            <div className="max-w-7xl w-full flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div className="flex flex-col gap-1">
                    <p className="font-bold text-sm opacity-80 decoration-primary/30">
                        สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดกำแพงเพชร
                    </p>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest font-medium">
                        Kamphaeng Phet Provincial Social Development and Human Security Office
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-base-content/40">
                        <a className="hover:text-[#1877F2] transition-colors"><FontAwesomeIcon icon={faFacebook} /></a>
                        <a className="hover:text-[#00B900] transition-colors"><FontAwesomeIcon icon={faLine} /></a>
                        <a className="hover:text-[#1DA1F2] transition-colors"><FontAwesomeIcon icon={faTwitter} /></a>
                    </div>
                    <div className="h-4 w-[1px] bg-base-300 hidden md:block"></div>
                    <p className="text-[11px] opacity-40 font-medium">
                        © {new Date().getFullYear()} PlanOS • v{process.env.NEXT_PUBLIC_APP_VERSION} (Build {process.env.NEXT_PUBLIC_BUILD_NUMBER}.{process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7)})
                    </p>
                </div>
            </div>
        </footer>
    );
}
