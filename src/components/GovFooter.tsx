import { Link } from "react-router-dom";

export default function GovFooter() {
  return (
    <footer className="no-print mt-auto bg-blue-950 text-white border-t border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-bold mb-3 text-base text-amber-400">Office Details</h3>
            <p className="text-slate-200 leading-relaxed">Bagula 2 No Gram Panchayat</p>
            <p className="text-slate-300 leading-relaxed">Vill: Stationpara, P.O.: Bagula</p>
            <p className="text-slate-300 leading-relaxed">P.S.: Hanskhali, Nadia, W.B.</p>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-base text-amber-400">Workspaces &amp; Links</h3>
            <p className="text-slate-200 text-xs leading-relaxed">
              Email:{" "}
              <a
                href="mailto:bagula2nogp111@gmail.com"
                className="underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
              >
                bagula2nogp111@gmail.com
              </a>
            </p>
            <p className="text-slate-300 text-xs leading-relaxed mt-1">
              Working hours: Mon–Fri, 10:00 AM – 5:00 PM
            </p>
            <div className="mt-3 space-y-1.5">
              <Link to="/cyber-cafe" className="block text-slate-200 hover:text-white text-xs">
                Cyber Cafe &amp; Assisted Service Hub
              </Link>
              <Link to="/faq" className="block text-slate-200 hover:text-white text-xs">
                Operator FAQ &amp; Documentation SOP
              </Link>
              <Link to="/elected-representatives" className="block text-slate-200 hover:text-white text-xs">
                Elected Representatives Directory
              </Link>
              <Link to="/wbpms-info" className="block text-slate-200 hover:text-white text-xs">
                Document Requirements Booklet
              </Link>
              <a
                href="https://wbpms.in/citizen/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-200 hover:text-white text-xs"
              >
                External WBPMS Portal
              </a>
              <Link to="/admin" className="block text-amber-300 hover:text-white text-xs font-semibold pt-1">
                Office Login (DEO / Admin / Super Admin) →
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-base text-amber-400">Official Facilitation</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Digital administrative platform of Bagula 2 No Gram Panchayat supporting Cyber Cafe assisted application
              intake, ward inquiry, and DEO / Admin / Super Admin certificate processing.
            </p>
            <p className="text-slate-100 text-xs leading-relaxed mt-2 font-semibold">
              For official enquiries and physical document submission, visit the Gram Panchayat office.
            </p>
          </div>
        </div>

        <div className="border-t border-white/15 mt-6 pt-4">
          <div className="flex items-center justify-center gap-4 flex-wrap pb-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open_disclaimer_modal"))}
              className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white underline font-semibold transition-colors cursor-pointer min-h-[36px] px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>বিকাশমান পোর্টাল সতর্কবার্তা ও আইনি দায়মুক্তি ঘোষণাপত্র (Statutory Development Disclaimer)</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed text-center max-w-4xl mx-auto mb-3">
            <strong>Disclaimer:</strong> This website is a digital administrative platform of Bagula II Gram Panchayat
            for record management, certificate-related workflows and public certificate verification. Information and
            services available through this platform are subject to applicable Panchayat procedures and administrative
            review.
          </p>
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Bagula 2 No Gram Panchayat. All rights reserved.
          </p>
        </div>
      </div>
      <div className="gov-tricolor-top rotate-180" />
    </footer>
  );
}
