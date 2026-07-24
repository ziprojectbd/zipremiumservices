import { Link } from 'react-router-dom';
import { Mail, MessageCircle, MapPin, Send, Phone, Clock, Shield, Users, Globe, CheckCircle, Facebook, Instagram, ArrowRight } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-16 w-16 h-16 sm:w-24 sm:h-24 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-16 left-1/4 w-24 h-24 sm:w-40 sm:h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-16 right-16 w-20 h-20 sm:w-28 sm:h-28 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center px-2">
              Contact Us
            </h1>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-400" />
            </div>
          </div>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
            We're here to help! Get in touch with our team for any questions, support, or inquiries about our premium digital services.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Telegram */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-400/30 group-hover:scale-110 transition-transform duration-300">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Telegram</h3>
                <p className="text-xs sm:text-sm text-gray-400">Fastest Response</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">Join our Telegram channel for the latest updates and exclusive offers.</p>
            <a
              href="https://t.me/trustedearningsources"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 text-sm sm:text-base"
            >
              @trustedearningsources
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Personal Telegram */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-purple-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Direct Support</h3>
                <p className="text-xs sm:text-sm text-gray-400">Personal Assistance</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">Connect directly with our founder for personalized support and custom solutions.</p>
            <a
              href="https://t.me/zikrulislamjuwel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 text-sm sm:text-base"
            >
              @zikrulislamjuwel
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Facebook */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-pink-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full border border-pink-400/30 group-hover:scale-110 transition-transform duration-300">
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Facebook</h3>
                <p className="text-xs sm:text-sm text-gray-400">Social Updates</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">Follow us on Facebook for news, tips, and community discussions.</p>
            <a
              href="https://www.facebook.com/zikrulislam.juwel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors duration-300 text-sm sm:text-base"
            >
              MD ZIKRUL ISLAM
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Instagram */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-yellow-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400/30 group-hover:scale-110 transition-transform duration-300">
                <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Instagram</h3>
                <p className="text-xs sm:text-sm text-gray-400">Visual Updates</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">Follow our Instagram for behind-the-scenes content and service showcases.</p>
            <a
              href="https://www.instagram.com/zikrulislam.juwel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-300 text-sm sm:text-base"
            >
              @zikrulislam.juwel
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Business Hours */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-green-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Business Hours</h3>
                <p className="text-xs sm:text-sm text-gray-400">Always Available</p>
              </div>
            </div>
            <div className="space-y-2 text-gray-300 text-sm sm:text-base">
              <p className="flex justify-between">
                <span>Monday - Friday:</span>
                <span className="text-green-400">24/7</span>
              </p>
              <p className="flex justify-between">
                <span>Saturday - Sunday:</span>
                <span className="text-green-400">24/7</span>
              </p>
              <p className="flex justify-between">
                <span>Holidays:</span>
                <span className="text-green-400">24/7</span>
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl hover:border-indigo-500/50 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full border border-indigo-400/30 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Location</h3>
                <p className="text-xs sm:text-sm text-gray-400">Global Services</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">Based in Bangladesh, serving customers worldwide with digital excellence.</p>
            <div className="flex items-center gap-2 text-indigo-400">
              <Globe className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Global Digital Services</span>
            </div>
          </div>
        </div>

        {/* Support Channels */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-500/30 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">How We Can Help You</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="p-3 bg-gray-800/50 rounded-full inline-flex mb-3">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Technical Support</h3>
              <p className="text-xs sm:text-sm text-gray-400">Help with setup, troubleshooting, and usage</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-gray-800/50 rounded-full inline-flex mb-3">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Custom Solutions</h3>
              <p className="text-xs sm:text-sm text-gray-400">Tailored packages for businesses and teams</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-gray-800/50 rounded-full inline-flex mb-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">After-Sales Care</h3>
              <p className="text-xs sm:text-sm text-gray-400">Ongoing support and service assistance</p>
            </div>
          </div>
        </div>

        {/* Response Time Info */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Response Times</h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-green-400 mb-1">&lt; 5 Minutes</p>
              <p className="text-xs sm:text-sm text-gray-400">Telegram Response</p>
            </div>
            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">&lt; 1 Hour</p>
              <p className="text-xs sm:text-sm text-gray-400">Email Response</p>
            </div>
            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-purple-400 mb-1">24/7</p>
              <p className="text-xs sm:text-sm text-gray-400">Emergency Support</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-400/30">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">How quickly will I receive my order?</h4>
              <p className="text-gray-400 text-xs sm:text-sm">Most orders are delivered instantly within 5-10 minutes after payment confirmation.</p>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">What payment methods do you accept?</h4>
              <p className="text-gray-400 text-xs sm:text-sm">We accept local Bangladeshi payment methods including bKash, Nagad, Rocket, and bank transfers.</p>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Are your services legal and safe?</h4>
              <p className="text-gray-400 text-xs sm:text-sm">Yes, all our services are 100% legal, genuine, and safe. We provide official subscriptions and accounts.</p>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">Do you offer refunds?</h4>
              <p className="text-gray-400 text-xs sm:text-sm">We offer refunds for unused services within 24 hours of purchase, subject to our refund policy.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-8 sm:mt-12 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-2xl mx-auto px-4">
            Don't wait! Contact us now through Telegram for the fastest response and get instant access to premium digital services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://t.me/trustedearningsources"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Contact on Telegram
              <Send className="w-4 h-4" />
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 text-sm sm:text-base"
            >
              Browse Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
