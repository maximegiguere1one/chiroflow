import React from 'react';
import {
  Building2,
  Users,
  Calendar,
  Bell,
  CreditCard,
  BarChart3,
  Lock,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  FileText,
  DollarSign,
} from 'lucide-react';

interface PricingTier {
  name: string;
  slug: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  limits: {
    users: number | string;
    patients: number | string;
    appointments: number | string;
  };
  highlighted?: boolean;
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: 29,
    yearlyPrice: 290,
    description: 'Perfect for solo practitioners just getting started',
    features: [
      'Appointment scheduling',
      'Patient management',
      'Basic billing',
      'Email reminders',
      'Calendar integration',
      'Mobile responsive',
    ],
    limits: {
      users: 2,
      patients: 100,
      appointments: '200/month',
    },
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    slug: 'professional',
    price: 79,
    yearlyPrice: 790,
    description: 'For growing practices with multiple providers',
    features: [
      'Everything in Starter',
      'SMS reminders',
      'Patient portal',
      'Advanced billing',
      'Analytics dashboard',
      'Waitlist management',
      'Automated follow-ups',
      'Custom branding',
      'Priority support',
    ],
    limits: {
      users: 10,
      patients: 1000,
      appointments: '2000/month',
    },
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: 199,
    yearlyPrice: 1990,
    description: 'For large multi-location practices',
    features: [
      'Everything in Professional',
      'Unlimited users',
      'Unlimited patients',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label branding',
      'Advanced security',
      'Custom domain',
      'SLA guarantee',
      'Training & onboarding',
    ],
    limits: {
      users: 'Unlimited',
      patients: 'Unlimited',
      appointments: 'Unlimited',
    },
    cta: 'Contact Sales',
  },
];

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Intelligent appointment booking with conflict detection and optimization',
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description: 'Email, SMS, and voice reminders to reduce no-shows by up to 80%',
  },
  {
    icon: Users,
    title: 'Patient Portal',
    description: 'Self-service booking, rescheduling, and payment management',
  },
  {
    icon: CreditCard,
    title: 'Integrated Billing',
    description: 'Invoice generation, payment processing, and autopay options',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into practice performance and patient trends',
  },
  {
    icon: Lock,
    title: 'HIPAA Compliant',
    description: 'Enterprise-grade security and data protection for patient information',
  },
  {
    icon: MessageSquare,
    title: 'Waitlist Management',
    description: 'Automatically fill cancellations with intelligent waitlist notifications',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Streamline operations with smart automation for repetitive tasks',
  },
];

const testimonials = [
  {
    name: 'Dr. Sarah Mitchell',
    role: 'Chiropractor, Mitchell Wellness Center',
    image: null,
    quote: 'ChiroFlow transformed our practice. We went from spending 2 hours daily on scheduling to just 15 minutes. No-shows dropped by 75%.',
    rating: 5,
  },
  {
    name: 'Dr. James Chen',
    role: 'Clinic Owner, HealthFirst Chiropractic',
    image: null,
    quote: 'The automated waitlist feature alone pays for itself. We fill cancelled slots within minutes and increased revenue by 23% in the first quarter.',
    rating: 5,
  },
  {
    name: 'Dr. Emily Rodriguez',
    role: 'Multi-location Practice Owner',
    image: null,
    quote: 'Managing 3 locations was a nightmare before ChiroFlow. Now everything is centralized, and our team productivity has doubled.',
    rating: 5,
  },
];

const stats = [
  { value: '500+', label: 'Clinics Worldwide' },
  { value: '50K+', label: 'Appointments/Month' },
  { value: '85%', label: 'No-Show Reduction' },
  { value: '99.9%', label: 'Uptime SLA' },
];

export const SaaSLandingPage: React.FC = () => {
  const [billingInterval, setBillingInterval] = React.useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-neutral-900">ChiroFlow</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-neutral-600 hover:text-neutral-900 transition">Features</a>
            <a href="#pricing" className="text-neutral-600 hover:text-neutral-900 transition">Pricing</a>
            <a href="#testimonials" className="text-neutral-600 hover:text-neutral-900 transition">Testimonials</a>
            <a href="/admin/login" className="text-neutral-600 hover:text-neutral-900 transition">Login</a>
            <button
              onClick={() => window.location.href = '/admin/signup'}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Start Free Trial
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 pt-20 pb-32">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Zap className="w-4 h-4" />
                <span>Trusted by 500+ chiropractic practices</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                  Chiropractic Practice
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed">
                All-in-one practice management software that saves you 10+ hours per week.
                Automate scheduling, billing, and patient communications.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button
                  onClick={() => window.location.href = '/admin/signup'}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold text-lg shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 flex items-center justify-center space-x-2"
                >
                  <span>Start Free 14-Day Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-neutral-900 rounded-xl hover:bg-neutral-50 transition font-semibold text-lg border-2 border-neutral-200">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm text-neutral-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="mt-20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-32 bottom-0 z-10"></div>
              <div className="rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop"
                  alt="ChiroFlow Dashboard"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-neutral-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-neutral-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Everything you need to run your practice
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Powerful features designed specifically for chiropractic practices
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-neutral-50 hover:bg-white hover:shadow-lg transition border border-neutral-100"
                  >
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 bg-gradient-to-br from-neutral-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-neutral-600 mb-8">
                Choose the plan that's right for your practice
              </p>

              <div className="inline-flex items-center bg-white rounded-xl p-1 shadow-sm border border-neutral-200">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    billingInterval === 'monthly'
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    billingInterval === 'yearly'
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-8 ${
                    tier.highlighted
                      ? 'bg-emerald-600 text-white shadow-2xl scale-105 relative'
                      : 'bg-white border-2 border-neutral-200'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-400 text-neutral-900 text-sm font-bold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      tier.highlighted ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`text-sm mb-6 ${
                      tier.highlighted ? 'text-emerald-100' : 'text-neutral-600'
                    }`}
                  >
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    <span
                      className={`text-5xl font-bold ${
                        tier.highlighted ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      ${billingInterval === 'monthly' ? tier.price : tier.yearlyPrice}
                    </span>
                    <span
                      className={`text-lg ${
                        tier.highlighted ? 'text-emerald-100' : 'text-neutral-600'
                      }`}
                    >
                      /{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <button
                    onClick={() => window.location.href = tier.slug === 'enterprise' ? '/contact' : '/admin/signup'}
                    className={`w-full py-3 rounded-xl font-semibold mb-6 transition ${
                      tier.highlighted
                        ? 'bg-white text-emerald-600 hover:bg-neutral-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  <div
                    className={`text-sm mb-4 pb-4 border-b ${
                      tier.highlighted ? 'border-emerald-500' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span>Up to {tier.limits.users} users</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="w-4 h-4" />
                      <span>{tier.limits.patients} patients</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{tier.limits.appointments}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            tier.highlighted ? 'text-emerald-200' : 'text-emerald-600'
                          }`}
                        />
                        <span
                          className={
                            tier.highlighted ? 'text-emerald-50' : 'text-neutral-600'
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Loved by practitioners worldwide
              </h2>
              <p className="text-xl text-neutral-600">
                See why practices choose ChiroFlow
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200"
                >
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-neutral-700 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                      <div className="text-sm text-neutral-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-emerald-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your practice?
            </h2>
            <p className="text-xl mb-8 text-emerald-50">
              Join hundreds of practices already saving 10+ hours per week
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.href = '/admin/signup'}
                className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-600 rounded-xl hover:bg-neutral-50 transition font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-white rounded-xl hover:bg-white/10 transition font-semibold text-lg border-2 border-white">
                Schedule a Demo
              </button>
            </div>
            <p className="mt-6 text-emerald-100 text-sm">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-bold">ChiroFlow</span>
              </div>
              <p className="text-neutral-400 text-sm">
                The all-in-one practice management platform for modern chiropractic practices.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
            <p>&copy; 2025 ChiroFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLandingPage;
