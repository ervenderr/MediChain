import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/medichain.svg" alt="MediChain" className="w-16 h-16" />
              <h1 className="text-5xl font-bold text-primary-600">MediChain</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Your Digital Health Wallet - You own your data!
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">
                Store Health Records
              </h3>
              <p className="text-gray-600 text-sm">
                Allergies, medications, conditions, and lab results in one
                secure place
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">QR Code Sharing</h3>
              <p className="text-gray-600 text-sm">
                Generate QR codes for instant, secure sharing with healthcare
                providers
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-4">🆘</div>
              <h3 className="text-lg font-semibold mb-2">Emergency Access</h3>
              <p className="text-gray-600 text-sm">
                Critical health info available when you need it most
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Your Health Wallet
            </Link>
            <Link
              href="/login"
              className="inline-block border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Secure & Private
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Easy QR Sharing
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Emergency Ready
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            MediChain - Patient-centered health records. Your data, your
            control.
          </p>
        </div>
      </footer>
    </div>
  );
}
