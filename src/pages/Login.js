import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Lock, ArrowRight, Loader2, Mail, ArrowLeft, MapPin } from 'lucide-react';
import RegisterModal from '../components/RegisterModal';
import { getConfig } from '../config';
import { useTheme } from '../context/ThemeContext';
import '../App.css'; // We'll add specific styles in App.css

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isSendingToken, setIsSendingToken] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changeToken, setChangeToken] = useState('');   // login password = emailString
    const [changeEmail, setChangeEmail] = useState('');   // email from login response
    const [changeForgot, setChangeForgot] = useState(false); // forgot from login response
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showServicePointSelect, setShowServicePointSelect] = useState(false);
    const [servicePoints, setServicePoints] = useState([]);
    const [selectedServicePointId, setSelectedServicePointId] = useState('');
    const [isLoadingServicePoints, setIsLoadingServicePoints] = useState(false);
    const [isConfirmingPoint, setIsConfirmingPoint] = useState(false);
    const [pendingSession, setPendingSession] = useState(null); // holds login data until service point confirmed
    const navigate = useNavigate();
    const { theme } = useTheme();

    const isDarkMode = theme === 'dark';
    const logoSrc = isDarkMode
        ? process.env.PUBLIC_URL + "/logo512_d.png"
        : process.env.PUBLIC_URL + "/logo512_l.png";

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const response = await axios.post(`${baseUrl}/user/login`, {
                username,
                password
            });

            if (response.data && response.data.data) {
                const { token, refreshToken, name, email, userType, serviceCenter, password: passwordValid, forgot, userId, id } = response.data.data;

                if (passwordValid === false) {
                    localStorage.setItem('tempToken', token);
                    setChangeEmail(username);
                    setChangeToken(password);
                    setChangeForgot(forgot || false);
                    setShowChangePassword(true);
                    return;
                }

                // If userType is 2, user must select a service point first, then redirect to /my-jobs
                if (Number(userType) === 2) {
                    const decoded = parseJwt(token);
                    const finalUserId = userId || id || response.data.data?.userId || response.data.data?.id || decoded?.user || decoded?.userId || decoded?.id || decoded?.sub || '';
                    setPendingSession({ token, refreshToken, name, email, userType, userId: finalUserId });
                    setIsLoadingServicePoints(true);
                    setShowServicePointSelect(true);

                    const targetCenter = serviceCenter || 2;
                    try {
                        const pts = await axios.get(`${getConfig().baseUrl}/service-points/service-center/${targetCenter}/dropdown`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        setServicePoints(pts.data?.data || []);
                    } catch (error) {
                        if (error?.response?.data?.data) {
                            if (error?.response?.data?.code === 1) {
                                toast.info("Session expired. Please login again.");
                                navigate('/login');
                            } else {
                                toast.error(error?.response?.data?.data);
                            }
                        } else {
                            toast.error('Network error');
                        }
                    } finally {
                        setIsLoadingServicePoints(false);
                    }
                    return;
                } else {
                    // For any other userType, redirect directly to /dashboard
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                    if (name) localStorage.setItem('userName', name);
                    if (email) localStorage.setItem('userEmail', email);
                    localStorage.setItem('userType', String(userType));

                    navigate('/dashboard');
                    return;
                }
            }

            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.data || 'Network Error';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {

        e.preventDefault();
        if (newPassword !== repeatPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsChangingPassword(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const tempToken = localStorage.getItem('tempToken');
            await axios.post(`${baseUrl}/user/new-password`, {
                emailString: changeToken,
                newPassword,
                email: changeEmail,
                forgot: changeForgot,
            }, {
                headers: { 'Authorization': `Bearer ${tempToken}` }
            });
            toast.success('Password Reset Completed');
            localStorage.removeItem('tempToken');
            setShowChangePassword(false);
            setChangeToken('');
            setChangeEmail('');
            setChangeForgot(false);
            setNewPassword('');
            setRepeatPassword('');
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSendToken = async (e) => {
        e.preventDefault();
        setIsSendingToken(true);

        try {
            const baseUrl = getConfig().baseUrl;
            await axios.post(`${baseUrl}/user/forget-password`, { email: forgotEmail });
            toast.success('Password reset token sent to your email');
            setShowForgotPassword(false);
            setForgotEmail('');
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setIsSendingToken(false);
        }
    };

    const handleConfirmServicePoint = async (point) => {
        if (!pendingSession) return;
        setIsConfirmingPoint(true);
        setSelectedServicePointId(String(point.id));
        const { token, refreshToken, name, email, userType, userId } = pendingSession;

        try {
            const baseUrl = getConfig().baseUrl;
            await axios.get(`${baseUrl}/agent/login/user/${userId}/to-point/${point.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            if (name) localStorage.setItem('userName', name);
            if (email) localStorage.setItem('userEmail', email);
            if (userType !== undefined) localStorage.setItem('userType', userType);
            localStorage.setItem('servicePointId', String(point.id));
            localStorage.setItem('servicePointName', point.name);

            if (Number(userType) === 2) {
                navigate('/my-jobs');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setIsConfirmingPoint(false);
        }
    };

    return (
        <div className="login-container">
            {showServicePointSelect ? (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        <p>Select your service point to continue</p>
                    </div>
                    <div className="login-form">
                        {isLoadingServicePoints ? (
                            <div style={{ padding: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Loader2 className="animate-spin" size={16} /> Loading service points...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '2px' }}>
                                {servicePoints.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="login-btn"
                                        disabled={isConfirmingPoint}
                                        onClick={() => handleConfirmServicePoint(p)}
                                        style={{ justifyContent: 'space-between', flexShrink: 0 }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={18} />
                                            {p.name}
                                        </span>
                                        {isConfirmingPoint && String(selectedServicePointId) === String(p.id)
                                            ? <Loader2 className="animate-spin" size={18} />
                                            : <ArrowRight size={18} />
                                        }
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : showChangePassword ? (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        <p>Set a new password to continue</p>
                    </div>
                    <form onSubmit={handleChangePassword} className="login-form">
                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                placeholder="Repeat Password"
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Update Password
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p onClick={() => setShowChangePassword(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </p>
                    </div>
                </div>
            ) : showForgotPassword ? (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        <p>Enter your email to receive a reset token</p>
                    </div>
                    <form onSubmit={handleSendToken} className="login-form">
                        <div className="input-group">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isSendingToken}>
                            {isSendingToken ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Token
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p onClick={() => setShowForgotPassword(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </p>
                    </div>
                </div>
            ) : (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        {/* <h2>Welcome Back</h2> */}
                        <p>Please sign in to continue</p>
                    </div>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
                        <p className="register-text">
                            Don't have an account? <span className="register-link" onClick={() => setIsRegisterModalOpen(true)}>Register</span>
                        </p>
                    </div>
                </div>
            )}

            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
};

export default Login;
