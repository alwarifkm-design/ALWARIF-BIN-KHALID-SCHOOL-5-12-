import { useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleSendOTP(e) {
    e.preventDefault()

    if (!supabase) {
      alert('Supabase غير مفعّل. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY أولاً.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    setLoading(false)

    if (error) {
      console.error('تفاصيل الخطأ:', error)
      alert('حدث خطأ أثناء الإرسال: ' + error.message)
      return
    }

    alert('تم إرسال الكود بنجاح! افحص صندوق الوارد أو الـ Spam.')
    setStep(2)
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()

    if (!supabase) {
      alert('Supabase غير مفعّل.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    setLoading(false)

    if (error) {
      console.error('تفاصيل الخطأ:', error)
      alert('الكود غير صحيح: ' + error.message)
      return
    }

    alert('تم تسجيل الدخول بنجاح! 🎉')
    console.log('بيانات الجلسة:', data)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      {step === 1 ? (
        <form onSubmit={handleSendOTP}>
          <h2>مدرسة الوارف بن خالد</h2>
          <p>تسجيل الدخول عبر البريد الإلكتروني</p>
          <input
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {loading ? 'جاري الإرسال...' : 'أرسل كود OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <h2>أدخل رمز التحقق (OTP)</h2>
          <p>تم إرسال الرمز إلى: {email}</p>
          <input
            type="text"
            placeholder="أدخل الرمز المكون من 6 أرقام"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
          </button>
        </form>
      )}
    </div>
  )
}

export default App