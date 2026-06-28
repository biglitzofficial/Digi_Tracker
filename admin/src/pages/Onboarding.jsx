import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, Users, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

const steps = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Add Staff', icon: Users },
  { id: 3, title: 'Setup Modules', icon: Package },
  { id: 4, title: 'Complete', icon: CheckCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'gym',
    contactNumber: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleRegister = async () => {
    try {
      await authAPI.register({
        ...form,
        email: form.email || '',
        password: form.password || '',
        firstName: form.firstName || '',
        lastName: form.lastName || '',
      });
      toast.success('Account created!');
      setStep(4);
    } catch (err) {
      toast.error(parseApiError(err, 'Registration failed'));
    }
  };

  const finish = () => {
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <span className="text-2xl font-bold">DigiTracker Setup</span>
        </div>

        <div className="flex justify-between mb-8">
          {steps.map((s) => (
            <div key={s.id} className={`flex flex-col items-center flex-1 ${step >= s.id ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= s.id ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-200 dark:bg-gray-800'}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Tell us about your business</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">First Name</label>
                  <input className="input mt-1" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">Last Name</label>
                  <input className="input mt-1" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <input className="input mt-1" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Business Type</label>
                  <select className="input mt-1" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                    {['gym', 'restaurant', 'agency', 'retail', 'other'].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="input mt-1" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Password</label>
                  <input type="password" className="input mt-1" minLength={8} value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
              <button className="btn-primary w-full mt-4" onClick={() => setStep(2)} disabled={!form.businessName}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold">Invite your team</h2>
              <p className="text-gray-500">You can add staff members from the Staff page after setup.</p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(3)}>Skip for now</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold">Configure tracking modules</h2>
              <p className="text-gray-500">Default modules (Instagram, WhatsApp) will be created automatically.</p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary flex-1" onClick={handleRegister}>Create Account</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold">You're all set!</h2>
              <p className="text-gray-500">Your DigiTracker workspace is ready. Start tracking growth metrics today.</p>
              <button className="btn-primary w-full" onClick={finish}>Go to Dashboard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
