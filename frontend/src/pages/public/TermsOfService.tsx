import { Link } from 'react-router-dom';
import { FileText, Shield, AlertCircle, CheckCircle, Users, CreditCard, Lock, Globe, Scale, Clock, ArrowRight, MessageCircle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-20 h-20 sm:w-28 sm:h-28 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center px-2">
              Terms of Service
            </h1>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Agreement to Terms</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed text-sm sm:text-base">
              <p className="px-1">
                Welcome to ZI Premium Services. These Terms of Service (&quot;Terms&quot;) govern your use of our website, services, and products (collectively, the &quot;Service&quot;). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p className="px-1">
                ZI Premium Services (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides premium digital services including but not limited to streaming subscriptions, VPN services, social media growth tools, and productivity software. Your use of our Service is conditioned on your acceptance of and compliance with these Terms.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Services Description</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed text-sm sm:text-base">
              <p className="px-1">
                We provide access to premium digital services through legitimate and authorized channels. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm sm:text-base">
                <li>Streaming &amp; Media Services (Netflix, YouTube Premium, Spotify, etc.)</li>
                <li>Design &amp; Productivity Tools (Canva Pro, Graphic Tools, Team Accounts)</li>
                <li>Security &amp; VPN Services (ExpressVPN, NordVPN, other premium VPNs)</li>
                <li>Social Media Services (Growth tools, Engagement services, Custom packages)</li>
              </ul>
              <p className="px-1">
                All services provided are genuine, legal, and obtained through official channels or authorized resellers. We do not provide cracked, illegal, or unauthorized versions of any service.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">User Responsibilities</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Account Security
                </h4>
                <p className="text-gray-400 text-sm">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  Lawful Use
                </h4>
                <p className="text-gray-400 text-sm">You must use our services in compliance with all applicable laws and regulations. Illegal activities are strictly prohibited.</p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  Service Terms
                </h4>
                <p className="text-gray-400 text-sm">You must comply with the terms of service of the underlying premium services we provide access to.</p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  No Sharing
                </h4>
                <p className="text-gray-400 text-sm">Unless explicitly stated, sharing account credentials with others is prohibited and may result in account suspension.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-400/30">
                <CreditCard className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Payment Terms</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>All payments for our services must be made through our approved payment methods. We accept:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>bKash</li>
                <li>Nagad</li>
                <li>Rocket</li>
                <li>Bank Transfers</li>
                <li>Other local Bangladeshi payment methods as specified</li>
              </ul>
              <div className="bg-gray-900/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-white mb-2">Important Payment Notes:</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>&bull; All payments are non-refundable unless otherwise specified</li>
                  <li>&bull; Prices are subject to change without prior notice</li>
                  <li>&bull; We reserve the right to suspend services for non-payment</li>
                  <li>&bull; Payment confirmation is required before service activation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full border border-pink-400/30">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Refund Policy</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We offer refunds under the following conditions:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">24-Hour Refund Window</h4>
                    <p className="text-sm text-gray-400">Refunds are available within 24 hours of purchase for unused services.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Service Issues</h4>
                    <p className="text-sm text-gray-400">If we fail to deliver the promised service, you&quot;re eligible for a full refund.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Non-Refundable Items</h4>
                    <p className="text-sm text-gray-400">Custom packages, activated services, and digital products that have been accessed are non-refundable.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                To request a refund, contact our support team with your order details and reason for refund.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full border border-red-400/30">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Limitation of Liability</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>To the maximum extent permitted by law, ZI Premium Services shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Our liability is limited to:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 ml-4">
                  <li>Providing the services as described</li>
                  <li>Offering technical support for service-related issues</li>
                  <li>Ensuring timely delivery of purchased services</li>
                  <li>Maintaining account security to the best of our ability</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400">
                We are not responsible for service interruptions caused by third-party providers, internet connectivity issues, or factors beyond our control.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full border border-indigo-400/30">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Privacy and Data Protection</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>Your privacy is important to us. Our use of your personal information is governed by our Privacy Policy, which forms part of these Terms.</p>
              <div className="bg-gray-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">We collect and use information to:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 ml-4">
                  <li>Provide and maintain our services</li>
                  <li>Process payments and manage orders</li>
                  <li>Offer customer support</li>
                  <li>Improve our services and user experience</li>
                  <li>Communicate important updates</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400">
                We implement appropriate security measures to protect your personal information and do not sell or share your data with third parties for marketing purposes.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Service Availability</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We strive to maintain high service availability, but please note:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Services may be temporarily unavailable for maintenance or updates</li>
                <li>Some services may be region-restricted due to licensing agreements</li>
                <li>Third-party service providers may experience outages beyond our control</li>
                <li>We reserve the right to modify or discontinue services with reasonable notice</li>
              </ul>
              <p className="text-sm text-gray-400">
                We will notify customers of significant service disruptions through our communication channels.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full border border-red-400/30">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Termination</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>We reserve the right to terminate or suspend your account and access to our services if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You violate these Terms of Service</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>You misuse our services or share account credentials</li>
                <li>You fail to make required payments</li>
                <li>Your account poses a security risk to our services</li>
              </ul>
              <p className="text-sm text-gray-400">
                Upon termination, you will lose access to all services and any remaining credits or subscriptions.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full border border-purple-400/30">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Changes to Terms</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                We may update these Terms of Service from time to time to reflect changes in our services, legal requirements, or business practices. Updated terms will be posted on our website with the &quot;Last Updated&quot; date revised accordingly.
              </p>
              <p>
                Your continued use of our services after any changes constitutes acceptance of the updated Terms. We will notify customers of significant changes through our communication channels.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-blue-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">Contact Us</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Primary Contact</h4>
                  <p className="text-sm text-gray-400">Telegram: @trustedearningsources</p>
                  <p className="text-sm text-gray-400">Direct Support: @zikrulislamjuwel</p>
                </div>
                <div className="bg-gray-900/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Business Hours</h4>
                  <p className="text-sm text-gray-400">24/7 Support Available</p>
                  <p className="text-sm text-gray-400">Based in Bangladesh</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Thank You for Choosing ZI Premium Services
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
            >
              Back to Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
