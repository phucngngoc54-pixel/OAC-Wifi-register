
import React, { useState, useEffect, useCallback } from 'react';
import { OFFICE_IP, WEBHOOK_URL, IP_API } from './constants';

type AppStatus = 'idle' | 'loading_ip' | 'ready' | 'submitting' | 'success' | 'error';

const App: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>('loading_ip');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchIp = useCallback(async () => {
    setStatus('loading_ip');
    try {
      const response = await fetch(IP_API);
      if (!response.ok) throw new Error('Failed to fetch IP');
      const data = await response.json();
      setCurrentIp(data.ip);
      setStatus('ready');
    } catch (err) {
      console.error('IP Fetch Error:', err);
      setErrorMessage('Could not verify your network connection.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchIp();
  }, [fetchIp]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (currentIp !== OFFICE_IP) {
      setErrorMessage('Vui lòng dùng Wifi OAC');
      return;
    }

    setErrorMessage(null);
    setStatus('submitting');

    try {
      const payload = {
        name: fullName,
        userAgent: navigator.userAgent,
        ip: currentIp
      };

      // Using no-cors if the Apps Script isn't configured for CORS, 
      // though typically Apps Script webhooks handle standard POST.
      // We'll try standard first.
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Common requirement for Google Apps Script redirects
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Note: With 'no-cors', response.ok will be false and status 0.
      // We assume success if the request finishes without a catch error when using no-cors.
      setStatus('success');
    } catch (err) {
      console.error('Submission Error:', err);
      setErrorMessage('An error occurred during registration. Please try again.');
      setStatus('ready');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        
        {/* Header Decoration */}
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <i className="fa-solid fa-laptop-medical text-2xl text-blue-600"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Device Registration
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Register your workspace device securely.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <i className="fa-solid fa-check text-4xl text-green-600"></i>
              </div>
              <h2 className="text-3xl font-extrabold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600">Your device has been registered successfully.</p>
              <button 
                onClick={() => { setStatus('ready'); setFullName(''); }}
                className="mt-8 text-blue-600 font-medium hover:underline flex items-center justify-center mx-auto"
              >
                Register another device
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Status Banner */}
              <div className={`p-3 rounded-lg flex items-center gap-3 text-xs font-medium ${
                currentIp === OFFICE_IP 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-amber-50 text-amber-700'
              }`}>
                <i className={`fa-solid ${currentIp === OFFICE_IP ? 'fa-wifi' : 'fa-triangle-exclamation'}`}></i>
                <span>
                  {status === 'loading_ip' ? 'Detecting network...' : `Current IP: ${currentIp || 'Unknown'}`}
                </span>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-regular fa-user text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    disabled={status === 'submitting' || status === 'loading_ip'}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in slide-in-from-top-2 duration-300">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fa-solid fa-circle-xmark text-red-400"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting' || status === 'loading_ip'}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  status === 'submitting' || status === 'loading_ip'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                }`}
              >
                {status === 'submitting' ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    Processing...
                  </>
                ) : (
                  'Register My Device'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            Registration is only available via internal OAC network.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
