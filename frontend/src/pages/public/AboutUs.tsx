import { Link } from 'react-router-dom';
import { Users, Target, Award, Globe, Heart, Star, CheckCircle, ArrowRight, Mail, MessageCircle, MapPin, Shield, Zap } from 'lucide-react';

export default function AboutUs() {
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
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center px-2">
              About Us
            </h1>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-400" />
            </div>
          </div>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
            Your trusted partner for premium digital services, delivered with excellence and support from Bangladesh to the world.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Our Story */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-400/30">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Our Story</h2>
            </div>

            <div className="space-y-4 text-gray-300 leading-relaxed text-sm sm:text-base">
              <p className="px-1">
                Founded with a vision to make premium digital services accessible to everyone, ZI Premium Services has become a trusted name in the digital marketplace. Based in Bangladesh, we bridge the gap between global premium services and local users who deserve the best digital experiences at affordable prices.
              </p>
              <p className="px-1">
                What started as a small initiative has grown into a comprehensive platform offering everything from streaming subscriptions to VPN services, social media growth tools, and productivity software. Our journey has been driven by one simple principle: everyone deserves access to premium digital tools without breaking the bank.
              </p>
              <p className="px-1">
                Today, we serve thousands of customers across Bangladesh and beyond, providing reliable, fast, and secure access to the world's best digital services. Our commitment to quality, affordability, and customer satisfaction remains at the heart of everything we do.
              </p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-400/30">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                To democratize access to premium digital services by providing affordable, reliable, and secure solutions that empower individuals and businesses to thrive in the digital world.
              </p>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Our Vision</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                To become the leading digital services provider in South Asia, known for exceptional customer service, unbeatable prices, and a comprehensive suite of premium digital solutions.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Our Core Values</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Trust & Reliability</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Building lasting relationships through honest service and consistent quality.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Customer First</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Your satisfaction is our priority, with 24/7 support to help you succeed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Innovation</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Continuously expanding our services to meet evolving digital needs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Affordability</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Premium services shouldn't be luxury - they should be accessible to all.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Security</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Protecting your data and privacy with enterprise-grade security measures.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">Speed & Efficiency</h4>
                  <p className="text-xs sm:text-sm text-gray-400">Fast delivery and quick resolution of any issues you may face.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-500/30 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Why Choose ZI Premium Services?</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">100% Genuine & Legal Services</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">Instant Delivery & Setup</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">24/7 Customer Support</span>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">Best Price Guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">Global Services, Local Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-300">Trusted by 5000+ Customers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Founder Note */}
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full border border-pink-400/30">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">A Message from Our Founder</h2>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-4 sm:p-6 border border-gray-700/50">
              <p className="text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
                "When I started ZI Premium Services, my goal was simple: make premium digital tools accessible to everyone in Bangladesh and beyond. I saw how many people wanted to use the best apps and services but couldn't afford the high prices.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
                Today, we're not just selling subscriptions – we're providing opportunities. Opportunities for students to access learning tools, for professionals to boost productivity, for creators to grow their audience, and for businesses to compete globally.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Thank you for trusting us with your digital journey. We're committed to serving you with excellence, integrity, and the passion that has driven us from day one.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <p className="text-white font-semibold text-sm sm:text-base">MD ZIKRUL ISLAM</p>
                <p className="text-gray-400 text-xs sm:text-sm">Founder & CEO, ZI Premium Services</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-2xl mx-auto px-4">
              Join thousands of satisfied customers who trust ZI Premium Services for their digital needs. Experience the best premium services at unbeatable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Browse Services
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact-us"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 text-sm sm:text-base"
              >
                Contact Us
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
