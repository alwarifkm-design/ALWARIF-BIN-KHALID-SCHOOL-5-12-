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

    alert('تم إرسال الكود بنجاح! افحص صندوق الوارد.')
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      direction: 'rtl',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '40px 30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        color: '#fff',
        textAlign: 'center'
      }}>
        {/* اللوجو والعنوان */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 15px',
            backgroundColor: '#d97706',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 20px rgba(217, 119, 6, 0.3)'
          }}>
            🎓
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px', color: '#f8fafc' }}>
            مدرسة الوارف بن خالد
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            {step === 1 ? 'بوابة الدخول الذكية والآمنة' : 'إدخال رمز الأمان (OTP)'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div style={{ textAlgin: 'right', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '8px', textAlign: 'right' }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                placeholder="example@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'جاري إرسال الرمز...' : 'أرسل رمز الدخول'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '20px' }}>
              تم إرسال رمز مكون من 6 أرقام إلى: <br/>
              <strong style={{ color: '#fbbf24' }}>{email}</strong>
            </p>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fbbf24',
                  fontSize: '22px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)'
              }}
            >
              {loading ? 'جاري التحقق...' : 'تأكيد الرمز والدخول'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                marginTop: '15px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              تغيير البريد الإلكتروني
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App