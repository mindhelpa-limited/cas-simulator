// If you keep the folder named "contact us", place this file at:
// app/contact us/page.tsx
// Recommended: rename folder to "contact-us" and place at app/contact-us/page.tsx

import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | CareerEdu",
  description:
    "Get in touch with CareerEdu — call, email, or visit our main office.",
};

const phoneDisplay = "+44 786 9467 057";
const phoneHref = "+447869467057"; // no spaces for tel:
const email = "info@careeredu.co.uk";
const addressLine1 = "1st Floor, North Westgate House,";
const addressLine2 = "Harlow Essex, CM20 1YS";

// Optional: link to Google Maps
const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=North+Westgate+House,+Harlow,+CM20+1YS";

export default function ContactPage() {
  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Contact Us
        </h1>
        <p className="mt-2 text-gray-600">
          We’re here to help. Reach us any time.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {/* Call */}
          <div className="rounded-xl bg-[#121821] p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-violet-400">
              <Phone className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              Call Us 24x7
            </h2>
            <a
              className="mt-3 block text-lg text-white/90 hover:underline"
              href={`tel:${phoneHref}`}
            >
              {phoneDisplay}
            </a>
          </div>

          {/* Email */}
          <div className="rounded-xl bg-violet-600 p-8 text-center text-white shadow-[0_10px_40px_rgba(88,63,239,0.35)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-2 ring-white">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Write Us</h2>
            <a
              className="mt-3 block text-lg hover:underline"
              href={`mailto:${email}`}
            >
              Info@Careeredu.Co.Uk
            </a>
          </div>

          {/* Address */}
          <div className="rounded-xl bg-[#121821] p-8 text-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-violet-400">
              <MapPin className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Main Office</h2>
            <a
              className="mt-3 block text-lg text-white/90 hover:underline"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              {addressLine1}
              <br />
              {addressLine2}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
