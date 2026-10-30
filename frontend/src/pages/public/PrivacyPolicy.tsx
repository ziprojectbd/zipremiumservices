import { Shield, Lock, Eye, User, Globe, Cookie, Database, AlertCircle, CheckCircle, Mail, MessageCircle, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
              Privacy Policy
            </h1>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-400/20">
            <p className="text-base sm:text-lg leading-relaxed text-center">
              At <span className="font-bold text-blue-400">ZI Premium Services</span>, we are committed to protecting your privacy and ensuring the security of your personal information.
              This Privacy Policy outlines how we collect, use, and protect your data when you use our services.
            </p>
          </div>

          <div className="space-y-8">
            {/* Information We Collect */}
            <section className="group">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-blue-300">Information We Collect</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ml-0 sm:ml-9">
                <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:border-blue-500/30 transition-colors">
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-purple-300 flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Personal Information
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Name and contact information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Payment details (processed securely)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Account credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Communication preferences</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:border-purple-500/30 transition-colors">
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-purple-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    Usage Data
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Service access patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Transaction history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Technical usage information</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="group">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4">
                <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-blue-300">How We Use Your Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ml-0 sm:ml-9">
                {[
                  "To provide and maintain our premium services",
                  "To process transactions and deliver purchased services",
                  "To communicate with you about your orders and account",
                  "To improve our services and user experience",
                  "To ensure security and prevent fraud",
                  "To comply with legal obligations"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 bg-gray-700/20 rounded-lg p-2 sm:p-3 border border-gray-600/30 hover:border-purple-500/30 transition-all">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm sm:text-base text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Protection */}
            <section className="group">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-blue-300">Data Protection</h2>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-3 sm:p-4 border border-green-400/20 ml-0 sm:ml-9">
                <p className="mb-2 sm:mb-3 text-sm sm:text-base text-gray-200">We implement industry-standard security measures to protect your personal information:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[
                    "Secure encryption for data transmission",
                    "Regular security audits and updates",
                    "Limited access to personal data",
                    "Secure payment processing through trusted providers"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm sm:text-base text-gray-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Additional Sections */}
            {[
              {
                icon: MessageCircle,
                title: "Third-Party Services",
                content: "We work with trusted third-party service providers for payment processing, service delivery, and analytics. These providers are contractually obligated to protect your data and only use it for specific purposes."
              },
              {
                icon: User,
                title: "Your Rights",
                items: [
                  "Access to your personal information",
                  "Correction of inaccurate data",
                  "Deletion of your account and data",
                  "Opt-out of marketing communications",
                  "Data portability"
                ]
              },
              {
                icon: Cookie,
                title: "Cookies and Tracking",
                content: "We use cookies and similar technologies to enhance your experience, analyze site usage, and personalize content. You can control cookie settings through your browser preferences."
              },
              {
                icon: Globe,
                title: "International Data Transfers",
                content: "As a global service provider, we may transfer data across borders. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws."
              },
              {
                icon: AlertCircle,
                title: "Children's Privacy",
                content: "Our services are not intended for individuals under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will take immediate steps to remove it."
              },
              {
                icon: Eye,
                title: "Changes to This Policy",
                content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last Updated' date."
              }
            ].map((section, index) => (
              <section key={index} className="group">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4">
                  <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                    <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-blue-300">{section.title}</h2>
                </div>
                <div className="ml-0 sm:ml-9">
                  {section.items ? (
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-1.5 sm:gap-2">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-sm sm:text-base text-gray-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-200 leading-relaxed bg-gray-700/20 rounded-lg p-3 sm:p-4 border border-gray-600/30">
                      {section.content}
                    </p>
                  )}
                </div>
              </section>
            ))}

            {/* Contact Section */}
            <section className="group">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-4">
                <div className="p-1.5 sm:p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-blue-300">Contact Us</h2>
              </div>
              <div className="ml-0 sm:ml-9">
                <p className="text-sm sm:text-base text-gray-200 mb-3 sm:mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-4 sm:p-6 border border-pink-400/20">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:border-pink-500/30 transition-colors">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm">Email</span>
                        <p className="font-medium">support@zipremium.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:border-purple-500/30 transition-colors">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm">Telegram</span>
                        <p className="font-medium">@zikrulislamjuwel</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/50 hover:border-blue-500/30 transition-colors">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm">Location</span>
                        <p className="font-medium">Global Digital Services, Based in Bangladesh</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-sm sm:text-base font-bold text-center">
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent">
              &copy; {new Date().getFullYear()} ZI PREMIUM SERVICES
            </span>
            <span className="text-white">. All rights reserved.</span>
          </p>
          <p className="mt-2 text-xs sm:text-sm text-gray-400">
            Your privacy is our priority. We're committed to protecting your data.
          </p>
        </div>
      </div>
    </div>
  );
}
