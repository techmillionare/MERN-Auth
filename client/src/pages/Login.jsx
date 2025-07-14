import { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [state, setState] = useState('Login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (state === 'Sign Up') {
        // Sign up logic
        await axios.post('http://localhost:4000/api/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        setState('Login'); // Switch to login after successful signup
      } else {
        // Login logic
        const response = await axios.post('http://localhost:4000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard'); // Redirect to dashboard after login
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400'>
      <img 
        src={assets.logo} 
        alt="" 
        className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
      />
      
      <div className='bg-slate-900 p-10 rounded-lg shadow-lg width-full sm:w-96 text-indigo-300 text-sm'>
        <h2 className='text-3xl font-semibold text-white text-center mb-3'>
          {state === 'Sign Up' ? 'Create account' : 'Login'}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <p className='text-center text-sm mb-6'>
          {state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {state === 'Sign Up' && (
            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
              <img src={assets.person_icon} alt="" />
              <input 
                className='bg-transparent outline-none' 
                type="text" 
                name="name"
                placeholder='Full Name' 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.mail_icon} alt="" />
            <input 
              className='bg-transparent outline-none' 
              type="email" 
              name="email"
              placeholder='Email id' 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.lock_icon} alt="" />
            <input 
              className='bg-transparent outline-none' 
              type="password" 
              name="password"
              placeholder='Password' 
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <p className='mb-4 text-indigo-500 cursor-pointer'>Forgot Password?</p>

          <button 
            type="submit"
            className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 font-medium'
            disabled={loading}
          >
            {loading ? 'Processing...' : state}
          </button>

          {state === 'Sign Up' ? (
            <p className='text-gray-400 text-center text-xs mt-4'>
              Already have an account?{' '}
              <span 
                onClick={() => setState('Login')} 
                className='text-blue-400 cursor-pointer underline'
              >
                Login here
              </span>
            </p>
          ) : (
            <p className='text-gray-400 text-center text-xs mt-4'>
              Don't have an account?{' '}
              <span 
                onClick={() => setState('Sign Up')} 
                className='text-blue-400 cursor-pointer underline'
              >
                Sign up
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;