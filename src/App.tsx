import { useState, FormEvent, useEffect, Fragment, useRef, ChangeEvent } from 'react';
import axios from 'axios';
import myQrImage from './qr.jpg';

// === THÊM ẢNH DANH MỤC CỦA BẠN ===
import anhTft from './assets/tft.png'; 
import anhLol from './assets/lol.jpeg';
import anhLienQuan from './assets/AOV.jpg';
// ================================

// ĐỊA CHỈ API BACKEND CỦA BẠN
const API_URL = 'http://localhost:3000';

enum ProductCategory {
  TFT = 'tft',
  LOL = 'lol',
  LIENQUAN = 'lienquan',
}

// == Kiểu dữ liệu cho User ==
interface User {
  name: string;
  email: string;
  role: string;
  sub: string; // _id
  balance: number;
  avatar?: string;
}

// == Kiểu dữ liệu cho Admin Dashboard ==
interface AdminStats {
  totalUsers: number;
  summary: {
    totalRevenue: number;
    totalPurchases: number;
  };
}
interface PendingDeposit {
  _id: string;
  amount: number;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

// === CẬP NHẬT: Kiểu dữ liệu Product (Full) ===
interface Product {
  _id: string;
  category: ProductCategory;
  name: string;
  description: string;
  image: string;
  price: number;
  status: 'available' | 'sold';
  // Thêm các trường này (optional) để form Admin có thể nhận
  accountUsername?: string;
  accountPassword?: string;
}
// ===========================================

// ... (Các hàm tiện ích: getAuthHeaders, fileToBase64 giữ nguyên) ...
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


// ... (Các component: LoginForm, RegisterForm, VerifyForm, InitialPopup, UserMenu, UserProfile, DepositPage giữ nguyên) ...
function LoginForm({ onLoginSuccess, onSwitchToRegister, setMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      setMessage('Đăng nhập thành công!');
      onLoginSuccess(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage('Lỗi: ' + error.response.data.message);
      } else {
        setMessage('Đã xảy ra lỗi, vui lòng thử lại.');
      }
    }
  };

  return (
    <Fragment>
      <h2 className="modal-title">Đăng Nhập</h2>
      <form onSubmit={handleSubmit} className="modal-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          required
        />
        <button type="submit" className="btn btn-primary btn-full">
          Đăng Nhập
        </button>
      </form>
      <div className="popup-switch-mode">
        Chưa có tài khoản?
        <button onClick={onSwitchToRegister}>Đăng ký ngay</button>
      </div>
    </Fragment>
  );
}

function RegisterForm({ onRegisterSuccess, onSwitchToLogin, setMessage }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Lỗi: Mật khẩu không khớp!');
      return;
    }
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        confirmPassword,
      });
      setMessage('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.');
      onRegisterSuccess(email);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage('Lỗi: ' + error.response.data.message);
      } else {
        setMessage('Đã xảy ra lỗi, vui lòng thử lại.');
      }
    }
  };

  return (
    <Fragment>
      <h2 className="modal-title">Tạo Tài Khoản Mới</h2>
      <form onSubmit={handleSubmit} className="modal-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên của bạn"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu (min 6 ký tự)"
          required
          minLength={6}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Xác nhận mật khẩu"
          required
          minLength={6}
        />
        <button type="submit" className="btn btn-primary btn-full">
          Đăng Ký
        </button>
      </form>
      <div className="popup-switch-mode">
        Đã có tài khoản?<button onClick={onSwitchToLogin}>Đăng nhập</button>
      </div>
    </Fragment>
  );
}

function VerifyForm({ email, onVerifySuccess, setMessage }) {
  const [otp, setOtp] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, {
        email,
        otp,
      });
      setMessage('Xác thực thành công! Đang đăng nhập...');
      onVerifySuccess(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage('Lỗi: ' + error.response.data.message);
      } else {
        setMessage('Đã xảy ra lỗi, vui lòng thử lại.');
      }
    }
  };

  return (
    <Fragment>
      <h2 className="modal-title">Xác Thực Tài Khoản</h2>
      <p className="modal-subtitle">
        Mã OTP đã được gửi đến <strong>{email}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="modal-form">
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Nhập 6 số OTP"
          required
          minLength={6}
          maxLength={6}
        />
        <button type="submit" className="btn btn-primary btn-full">
          Xác Thực
        </button>
      </form>
    </Fragment>
  );
}

function InitialPopup({ onShowLogin, onShowRegister, onGuest }) {
  return (
    <Fragment>
      <h2 className="modal-title">Chào mừng bạn!</h2>
      <p className="modal-subtitle">Vui lòng đăng nhập hoặc đăng ký.</p>
      <div className="modal-actions">
        <button onClick={onShowLogin} className="btn btn-primary btn-full">
          Đăng Nhập
        </button>
        <button onClick={onShowRegister} className="btn btn-secondary btn-full">
          Đăng ký ngay
        </button>
        <button onClick={onGuest} className="btn-link">
          Sử dụng với tư cách khách
        </button>
      </div>
    </Fragment>
  );
}

function UserMenu({ user, isLoggedIn, onShowAuth, onLogout, onNavigate }) {
  const defaultAvatar = 'https://placehold.co/40x40/005A9C/FFFFFF?text=U';
  const guestAvatar = 'https://placehold.co/40x40/F0F2F5/666?text=?';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAuthClick = (view: 'login' | 'register') => {
    onShowAuth(view);
    setIsOpen(false);
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button className="user-avatar-btn" onClick={() => setIsOpen(!isOpen)}>
        <img
          src={isLoggedIn ? user.avatar || defaultAvatar : guestAvatar}
          alt="Avatar"
          className="header-avatar"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = isLoggedIn ? defaultAvatar : guestAvatar;
          }}
        />
      </button>

      <div className={`dropdown-content ${isOpen ? 'open' : ''}`}>
        {isLoggedIn && user ? (
          <Fragment>
            <div className="dropdown-header">
              <strong>{user.name}</strong>
              <small>Số dư: {(user.balance ?? 0).toLocaleString()} đ</small>
            </div>
            <a href="#" onClick={() => handleNavigate('profile')}>
              Thông tin cá nhân
            </a>
            <a href="#" onClick={() => handleNavigate('deposit')}>
              Nạp tiền
            </a>
            {user.role === 'admin' && (
              <Fragment>
                <a href="#" onClick={() => handleNavigate('admin')}>
                  Admin Dashboard
                </a>
                <a href="#" onClick={() => handleNavigate('admin-products')}>
                  Quản lý Sản phẩm
                </a>
              </Fragment>
            )}
            <a href="#" onClick={handleLogout} className="logout-link">
              Đăng xuất
            </a>
          </Fragment>
        ) : (
          <Fragment>
            <div className="dropdown-header">
              <strong>Khách</strong>
              <small>Vui lòng đăng nhập</small>
            </div>
            <a href="#" onClick={() => handleAuthClick('login')}>
              Đăng nhập
            </a>
            <a href="#" onClick={() => handleAuthClick('register')}>
              Đăng ký
            </a>
          </Fragment>
        )}
      </div>
    </div>
  );
}

function UserProfile({ user, handleLogout, setUser }) {
  const [newName, setNewName] = useState(user?.name || '');
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
  const [updateMessage, setUpdateMessage] = useState('');

  if (!user) return <div className="user-profile">Đang tải...</div>;

  const displayBalance = (user.balance ?? 0).toLocaleString();
  const defaultAvatar = 'https://placehold.co/100x100/F0F2F5/666?text=U';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64String = await fileToBase64(file);
        setPreviewUrl(base64String);
      } catch (error) {
        setUpdateMessage('Lỗi chuyển đổi ảnh.');
      }
    }
  };

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    setUpdateMessage('');
    try {
      const response = await axios.put(
        `${API_URL}/api/user/me`,
        { name: newName, avatar: previewUrl },
        getAuthHeaders(),
      );

      setUser((prevUser) => ({ ...prevUser, ...response.data }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...response.data }));
      setUpdateMessage('Cập nhật thành công!');
    } catch (error) {
      console.error('Lỗi API cập nhật:', error);
      setUpdateMessage('Lỗi cập nhật: Vui lòng thử lại.');
    }
  };

  return (
    <div className="user-profile">
      <h2 className="section-title">Thông tin cá nhân</h2>
      <form onSubmit={handleUpdateProfile} className="profile-form">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <img
              src={previewUrl || user.avatar || defaultAvatar}
              alt="Avatar"
              className="avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultAvatar;
              }}
            />
            <label htmlFor="avatar-upload" className="avatar-edit-label">
              <i className="fas fa-camera"></i>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
        <div className="profile-details-form">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Số dư:</strong> {displayBalance} VND
          </p>
          <p>
            <strong>Vai trò:</strong>{' '}
            {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
          </p>
          <h3 className="form-section-title">Cập nhật hồ sơ</h3>
          <div className="form-group">
            <label>Tên mới:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Cập nhật tên & Avatar
          </button>
          {updateMessage && (
            <p
              className={`form-message ${
                updateMessage.startsWith('Lỗi') ? 'error' : 'success'
              }`}
            >
              {updateMessage}
            </p>
          )}
        </div>
      </form>
      <button
        className="btn btn-secondary"
        onClick={handleLogout}
        style={{ marginTop: '30px' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}

function DepositPage({ user, setUser }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(10000);
  const [message, setMessage] = useState('');
  const quickDepositOptions = [50000, 100000, 200000, 500000];
  const MY_QR_CODE_URL = myQrImage;

  if (!user) return <div className="user-profile">Đang tải...</div>;

  const handleDepositSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (amount < 10000) {
      setMessage('Lỗi: Số tiền nạp tối thiểu là 10,000 VND.');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/user/me/deposit`,
        { amount },
        getAuthHeaders(),
      );
      setMessage('');
      setStep(2);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage('Lỗi: ' + error.response.data.message);
      } else {
        setMessage('Đã xảy ra lỗi, vui lòng thử lại.');
      }
    }
  };

  const handleConfirmPayment = async () => {
    setMessage('');
    try {
      await axios.post(
        `${API_URL}/api/user/me/notify-deposit`,
        { amount },
        getAuthHeaders(),
      );
      setStep(3);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data.message || 'Lỗi không xác định';
        setMessage('Lỗi: ' + apiError);
        console.error('Lỗi API notify-deposit:', error.response.data);
      } else {
        setMessage('Đã xảy ra lỗi khi gửi thông báo đến admin.');
      }
    }
  };

  return (
    <div className="user-profile">
      {message && (
        <p
          className={`form-message ${
            message.startsWith('Lỗi') ? 'error' : 'success'
          }`}
        >
          {message}
        </p>
      )}

      {/* BƯỚC 1: Form Nhập Tiền */}
      {step === 1 && (
        <Fragment>
          <h2 className="section-title">Nạp Tiền Vào Tài Khoản</h2>
          <form
            onSubmit={handleDepositSubmit}
            className="modal-form"
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <div className="form-group">
              <label>Hoặc chọn nhanh mệnh giá:</label>
              <div className="quick-deposit-grid">
                {quickDepositOptions.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`quick-deposit-btn ${
                      amount === value ? 'active' : ''
                    }`}
                    onClick={() => setAmount(value)}
                  >
                    {value.toLocaleString()} VND
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Nhập số tiền muốn nạp (VND):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Nhập số tiền (tối thiểu 10.000)"
                min="10000"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              Xác nhận nạp tiền
            </button>
          </form>
        </Fragment>
      )}

      {/* BƯỚC 2: Hiển thị QR Code */}
      {step === 2 && (
        <div className="deposit-qr-step">
          <h2 className="section-title">Quét mã QR để thanh toán</h2>
          <p className="modal-subtitle">
            Sử dụng App ngân hàng của bạn để quét mã bên dưới.
          </p>
          <img
            src={MY_QR_CODE_URL}
            alt="Mã QR Ngân hàng"
            className="qr-code-image"
          />
          <p className="qr-note">
            <strong>Nội dung chuyển khoản (bắt buộc):</strong>
            <br />
            <code>Nạp Tiền ShopTFT</code>
          </p>
          <p className="qr-note">
            <strong>Số tiền:</strong>
            <br />
            <strong>{amount.toLocaleString()} VND</strong>
          </p>
          <button onClick={handleConfirmPayment} className="btn btn-primary btn-full">
            Tôi đã chuyển khoản
          </button>
        </div>
      )}

      {/* BƯỚC 3: Thông báo thành công */}
      {step === 3 && (
        <div className="deposit-success-step">
          <div className="success-checkmark">✔</div>
          <h2 className="section-title">Đã gửi yêu cầu nạp tiền!</h2>
          <p className="modal-subtitle">
            Yêu cầu nạp <strong>{amount.toLocaleString()} VND</strong> của bạn
            đã được ghi lại.
            <br />
            Admin sẽ xử lý và cộng tiền vào tài khoản của bạn sau giây lát.
          </p>
          <button
            onClick={() => setStep(1)}
            className="btn btn-secondary"
            style={{ marginTop: '20px' }}
          >
            Nạp thêm
          </button>
        </div>
      )}
    </div>
  );
}


// ... (Component AdminDashboard giữ nguyên) ...
// == Component Trang Admin (Admin Dashboard) ==
function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsPromise = axios.get(
        `${API_URL}/api/admin/revenue`,
        getAuthHeaders(),
      );
      const depositsPromise = axios.get(
        `${API_URL}/api/admin/pending-deposits`,
        getAuthHeaders(),
      );
      const [statsResponse, depositsResponse] = await Promise.all([
        statsPromise,
        depositsPromise,
      ]);
      setStats(statsResponse.data);
      setDeposits(depositsResponse.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu admin:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError('Lỗi: ' + err.response.data.message);
      } else {
        setError('Không thể tải dữ liệu admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (depositId: string) => {
    if (!confirm('Bạn có chắc muốn duyệt đơn nạp tiền này không?')) {
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/approve-deposit/${depositId}`,
        {},
        getAuthHeaders(),
      );
      alert(response.data.message);
      setDeposits((prevDeposits) =>
        prevDeposits.filter((d) => d._id !== depositId),
      );
    } catch (err) {
      console.error('Lỗi khi duyệt đơn:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert('Lỗi: ' + err.response.data.message);
      } else {
        alert('Không thể duyệt đơn nạp tiền.');
      }
    }
  };

  const handleRunSeeder = async () => {
    if (!confirm('Bạn có chắc muốn tạo 30 sản phẩm mẫu không? (Chỉ dùng để test)')) {
      return;
    }
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/seed-products`,
        getAuthHeaders(),
      );
      alert(response.data.message);
    } catch (err) {
      console.error('Lỗi khi chạy seeder:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert('Lỗi: ' + err.response.data.message);
      } else {
        alert('Không thể tạo sản phẩm mẫu.');
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <h2 className="section-title">Đang tải dữ liệu Admin...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <h2 className="section-title" style={{ color: 'red' }}>
          {error}
        </h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h2 className="section-title">Bảng điều khiển Admin</h2>

      <h3 className="form-section-title">Thống kê Doanh thu</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <strong>Tổng Doanh Thu:</strong>{' '}
          {stats?.summary.totalRevenue.toLocaleString() ?? 0} VND
        </div>
        <div className="admin-stat-card">
          <strong>Tổng Sản Phẩm Bán:</strong>{' '}
          {stats?.summary.totalPurchases ?? 0}
        </div>
        <div className="admin-stat-card">
          <strong>Tổng User:</strong> {stats?.totalUsers ?? 0}
        </div>
      </div>

      <h3 className="form-section-title">
        Yêu cầu nạp tiền chờ duyệt ({deposits.length})
      </h3>
      <div className="admin-table-container">
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Thời gian</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email User</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Tên User</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Số tiền (VND)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '12px' }}>
                  Không có đơn nạp tiền nào đang chờ.
                </td>
              </tr>
            ) : (
              deposits.map((deposit) => (
                <tr key={deposit._id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(deposit.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{deposit.user.email}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{deposit.user.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                    {deposit.amount.toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(deposit._id)}
                      style={{ fontSize: '13px', padding: '5px 10px' }}
                    >
                      Duyệt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="form-section-title" style={{ marginTop: '40px' }}>
        Quản lý Sản phẩm
      </h3>
      <button
        className="btn btn-secondary"
        onClick={() => onNavigate('admin-products')}
      >
        Đi đến trang Đăng/Sửa sản phẩm
      </button>

      <h3 className="form-section-title" style={{ marginTop: '40px' }}>
        Công cụ Test
      </h3>
      <button
        className="btn"
        onClick={handleRunSeeder}
        style={{backgroundColor: '#e67e22', color: 'white'}}
      >
        Chạy Tool tạo 30 sản phẩm mẫu
      </button>
    </div>
  );
}


// === CẬP NHẬT: Component ProductList giờ sẽ lọc theo Danh mục ===
function ProductList({ category, onBuyNow, onNavigate }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_URL}/products`, {
          params: { category: category }
        });
        setProducts(response.data);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
        setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  if (loading) {
    return <p>Đang tải sản phẩm...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }
  
  const categoryTitles = {
    [ProductCategory.TFT]: 'Tài khoản TFT',
    [ProductCategory.LOL]: 'Tài khoản LOL',
    [ProductCategory.LIENQUAN]: 'Tài khoản Liên Quân',
  };

  return (
    <Fragment>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2 className="section-title" style={{marginBottom: 0}}>
          {categoryTitles[category] || 'Sản phẩm'}
        </h2>
        <button className="btn btn-secondary" onClick={() => onNavigate('home')}>
          &larr; Quay lại Danh mục
        </button>
      </div>

      {products.length === 0 ? (
        <p>Hiện chưa có sản phẩm nào trong danh mục này.</p>
      ) : (
        <div className="category-grid">
          {products.map((product) => (
            <div className="category-card" key={product._id}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '170px',
                  objectFit: 'cover',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/300x170?text=Error';
                }}
              />
              <div className="card-content">
                <h3 style={{ minHeight: '40px', fontSize: '1.1rem' }}>{product.name}</h3>
                <p style={{ minHeight: '50px', fontSize: '0.9rem' }}>
                  {product.description.substring(0, 60)}...
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#c0392b' }}>
                  Giá: {product.price.toLocaleString()} VND
                </p>
                <button
                  onClick={() => onBuyNow(product)}
                  className="btn btn-primary btn-full"
                  style={{ marginTop: '10px' }}
                >
                  Mua ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Fragment>
  );
}


// === CẬP NHẬT: Component AdminProductManager (Thêm Sửa/Xóa/Danh sách) ===
function AdminProductManager() {
  // State cho Form
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.TFT);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State cho Bảng danh sách
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Hàm tải danh sách sản phẩm (cho Admin)
  const fetchAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/all-products`, getAuthHeaders());
      setAllProducts(response.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm admin:', err);
      setMessage('Lỗi: Không thể tải danh sách sản phẩm.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Tải danh sách khi component mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Hàm reset form
  const clearForm = () => {
    setEditingProductId(null);
    setCategory(ProductCategory.TFT);
    setName('');
    setDescription('');
    setPrice(0);
    setAccountUsername('');
    setAccountPassword('');
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Hàm xử lý khi bấm nút "Sửa"
  const handleEditClick = async (product: Product) => {
    setMessage('Đang tải dữ liệu sản phẩm...');
    try {
      // Gọi API để lấy data admin (có username/pass)
      const response = await axios.get(
        `${API_URL}/products/admin/${product._id}`, 
        getAuthHeaders()
      );
      const fullProductData: Product = response.data; // Gán kiểu Product (đã update)

      // Điền thông tin vào form
      setEditingProductId(fullProductData._id);
      setCategory(fullProductData.category);
      setName(fullProductData.name);
      setDescription(fullProductData.description);
      setPrice(fullProductData.price);
      setAccountUsername(fullProductData.accountUsername || ''); // Xử lý nếu nó undefined
      setAccountPassword(fullProductData.accountPassword || ''); // Xử lý nếu nó undefined
      setImage(null); // Reset file, admin có thể chọn file mới nếu muốn
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setMessage('Đang sửa sản phẩm. Hãy thay đổi thông tin và nhấn Cập nhật.');
      window.scrollTo(0, 0); // Cuộn lên đầu trang
    } catch (err) {
      setMessage('Lỗi: Không thể tải dữ liệu chi tiết của sản phẩm.');
    }
  };

  // Hàm xử lý khi bấm nút "Xóa"
  const handleDeleteClick = async (productId: string) => {
    if (!confirm('Bạn có chắc muốn XÓA VĨNH VIỄN sản phẩm này không?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/products/${productId}`, getAuthHeaders());
      setMessage('Xóa sản phẩm thành công!');
      // Tải lại danh sách
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      setMessage('Lỗi khi xóa sản phẩm.');
    }
  };

  // Hàm Submit (xử lý cả Thêm và Sửa)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Khi sửa, ảnh không bắt buộc
    if (!editingProductId && !image) {
      setMessage('Lỗi: Vui lòng chọn ảnh cho sản phẩm mới.');
      return;
    }
    
    setLoading(true);
    setMessage(editingProductId ? 'Đang cập nhật sản phẩm...' : 'Đang đăng sản phẩm...');

    const formData = new FormData();
    if (image) {
      formData.append('image', image); // Chỉ thêm ảnh nếu admin chọn file mới
    }
    formData.append('category', category);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', String(price));
    formData.append('accountUsername', accountUsername);
    formData.append('accountPassword', accountPassword);

    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      if (editingProductId) {
        await axios.put(`${API_URL}/products/${editingProductId}`, formData, { headers });
        setMessage('Cập nhật sản phẩm thành công!');
      } else {
        await axios.post(`${API_URL}/products`, formData, { headers });
        setMessage('Thêm sản phẩm thành công!');
      }

      setLoading(false);
      clearForm(); // Xóa form
      fetchAllProducts(); // Tải lại danh sách
      
    } catch (err) {
      console.error(err);
      setLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        alert('Lỗi: ' + err.response.data.message);
      } else {
        alert('Đã xảy ra lỗi.');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <h2 className="section-title">Quản lý Sản phẩm</h2>
      <h3 className="form-section-title">
        {editingProductId ? 'Sửa sản phẩm' : 'Đăng bán tài khoản mới'}
      </h3>

      <form
        onSubmit={handleSubmit}
        className="modal-form"
        style={{ maxWidth: '600px', margin: '0 auto' }}
      >
        {message && (
          <p
            className={`form-message ${
              message.startsWith('Lỗi') ? 'error' : 'success'
            }`}
          >
            {message}
          </p>
        )}
        
        <div className="form-group">
          <label>Chọn Danh mục (*)</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            style={{width: '100%', padding: '10px', fontSize: '1rem'}}
            required
          >
            <option value={ProductCategory.TFT}>Tài khoản TFT</option>
            <option value={ProductCategory.LOL}>Tài khoản LOL</option>
            <option value={ProductCategory.LIENQUAN}>Tài khoản Liên Quân</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tên sản phẩm (*)</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Mô tả (*)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} />
        </div>
        <div className="form-group">
          <label>Giá bán (VND) (*)</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min={0} />
        </div>
        <div className="form-group">
          <label>Tên đăng nhập (Tài khoản game) (*)</label>
          <input type="text" value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Mật khẩu (Tài khoản game)</label>
          <input type="text" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ảnh đại diện sản phẩm {editingProductId ? '(Để trống nếu không muốn đổi)' : '(*)'}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            required={!editingProductId} // Chỉ bắt buộc khi tạo mới
          />
        </div>
        
        <div style={{display: 'flex', gap: '10px'}}>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang xử lý...' : (editingProductId ? 'Cập nhật' : 'Đăng bán')}
          </button>
          {/* === THÊM NÚT HỦY SỬA === */}
          {editingProductId && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={clearForm}
              disabled={loading}
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* === THÊM MỚI: Bảng danh sách sản phẩm === */}
      <h3 className="form-section-title" style={{marginTop: '40px'}}>
        Danh sách tất cả sản phẩm
      </h3>
      {loadingProducts ? <p>Đang tải danh sách...</p> : (
        <div className="admin-table-container">
          <table className="admin-table" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Ảnh</th>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Tên</th>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Danh mục</th>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Giá (VND)</th>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Trạng thái</th>
                <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '12px' }}>Không có sản phẩm nào.</td></tr>
              ) : (
                allProducts.map((product) => (
                  <tr key={product._id} style={{backgroundColor: product.status === 'sold' ? '#f9f9f9' : '#fff'}}>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>
                      <img src={product.image} alt="icon" style={{width: '60px', height: '40px', objectFit: 'cover'}} />
                    </td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{product.name}</td>
                    {/* === SỬA LỖI CRASH: Thêm kiểm tra an toàn === */}
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>
                      {product.category ? product.category.toUpperCase() : 'N/A'}
                    </td>
                    {/* ======================================= */}
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>{product.price.toLocaleString()}</td>
                    <td style={{border: '1px solid #ddd', padding: '8px'}}>
                      {product.status === 'available' ? 'Có sẵn' : 'Đã bán'}
                    </td>
                    <td style={{border: '1px solid #ddd', padding: '8px', display: 'flex', gap: '5px'}}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEditClick(product)}
                        style={{fontSize: '13px', padding: '5px 10px'}}
                        disabled={product.status === 'sold'} // Không cho sửa acc đã bán
                      >
                        Sửa
                      </button>
                      <button
                        className="btn" // Nút xóa (cần CSS thêm)
                        onClick={() => handleDeleteClick(product._id)}
                        style={{fontSize: '13px', padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white'}}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
// ==========================================================

// === CẬP NHẬT: Component Trang chủ (Chỉ hiện Danh mục) ===
function CategoryHomePage({ onCategorySelect }) {
  // === SỬA: Dùng ảnh bạn đã import ===
  const categories = [
    { 
      id: ProductCategory.TFT, 
      name: 'Tài khoản TFT', 
      image: anhTft // Dùng ảnh đã import
    },
    { 
      id: ProductCategory.LOL, 
      name: 'Tài khoản LOL', 
      image: anhLol // Dùng ảnh đã import
    },
    { 
      id: ProductCategory.LIENQUAN, 
      name: 'Tài khoản Liên Quân', 
      image: anhLienQuan // Dùng ảnh đã import
    },
  ];

  return (
    <Fragment>
      <h2 className="section-title">Trang Chủ</h2>
      <div className="category-grid">
        {categories.map((cat) => (
          <div 
            className="category-card" 
            key={cat.id} 
            onClick={() => onCategorySelect(cat.id)}
            style={{cursor: 'pointer'}}
          >
            <img
              src={cat.image}
              alt={cat.name}
              style={{
                width: '100%',
                height: '170px',
                objectFit: 'cover',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
              }}
            />
            <div className="card-content">
              <h3 style={{ fontSize: '1.3rem' }}>{cat.name}</h3>
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: '10px' }}
              >
                Xem tất cả
              </button>
            </div>
          </div>
        ))}
      </div>
    </Fragment>
  );
}
// ==========================================================


// == Component APP CHÍNH ==
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<
    'initial' | 'register' | 'login' | 'verify'
  >('initial');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [message, setMessage] = useState('');
  
  const [currentPage, setCurrentPage] = useState('home');
  const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null);
  const [refreshProductsKey, setRefreshProductsKey] = useState(0); 

  // ... (Hàm verifyTokenAndRefreshUser, handleLoginSuccess, handleLogout giữ nguyên) ...
  const verifyTokenAndRefreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await axios.get(
          `${API_URL}/api/user/me`,
          getAuthHeaders(),
        );
        const freshUserData: User = response.data;

        setIsLoggedIn(true);
        setUser(freshUserData);
        localStorage.setItem('user', JSON.stringify(freshUserData));
        setShowModal(false);
        return freshUserData;
      } catch (error) {
        console.error('Token không hợp lệ, đang đăng xuất...');
        handleLogout();
        setShowModal(true);
        return null;
      }
    } else {
      setShowModal(true);
      return null;
    }
  };

  const handleLoginSuccess = async (data: { access_token: string; user: User }) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    const freshUser = await verifyTokenAndRefreshUser();
    
    if (freshUser) {
      if (freshUser.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('profile');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
    setShowModal(true);
  };

  useEffect(() => {
    const loadApp = async () => {
      const freshUser = await verifyTokenAndRefreshUser();
      if (freshUser) {
        if (freshUser.role === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('home');
        }
      } else {
        setCurrentPage('home');
      }
    };
    
    loadApp();
  }, []);

  // ... (Hàm handleBuyNow, handleNavigateToCategory, renderModalContent giữ nguyên) ...
  const handleBuyNow = async (product: Product) => {
    if (!isLoggedIn || !user) {
      setMessage('Vui lòng đăng nhập để mua hàng.');
      setModalView('login');
      setShowModal(true);
      return;
    }

    if (user.balance < product.price) {
      alert(
        `Lỗi: Bạn không đủ số dư!\n\n` +
        `Số dư của bạn: ${user.balance.toLocaleString()} VND\n` +
        `Giá sản phẩm: ${product.price.toLocaleString()} VND\n\n` +
        `Vui lòng nạp thêm tiền.`
      );
      return;
    }

    if (
      !confirm(
        `Bạn có chắc muốn mua "${product.name}"?\n` +
        `Giá: ${product.price.toLocaleString()} VND\n\n` +
        `Số dư của bạn sẽ bị trừ.`
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/products/buy/${product._id}`,
        {},
        getAuthHeaders(),
      );
      
      const boughtProduct = response.data.product;
      
      alert(
        `MUA HÀNG THÀNH CÔNG!\n\n` +
        `Sản phẩm: ${boughtProduct.name}\n` +
        `Tên đăng nhập: ${boughtProduct.accountUsername}\n` +
        `Mật khẩu: ${boughtProduct.accountPassword || '(Không có)'}\n\n` +
        `Vui lòng đổi mật khẩu ngay lập tức. Chúng tôi không lưu lại thông tin này.`
      );

      const newBalance = user.balance - product.price;
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setRefreshProductsKey(k => k + 1);
      setCurrentPage('products');

    } catch (err) {
      console.error('Lỗi khi mua hàng:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert('Lỗi: ' + err.response.data.message);
      } else {
        alert('Đã xảy ra lỗi khi mua hàng.');
      }
    }
  };
  
  const handleNavigateToCategory = (category: ProductCategory) => {
    setCurrentCategory(category);
    setCurrentPage('products');
  };
  
  const renderModalContent = () => {
    const messageDisplay = message && (
      <p
        className={`form-message ${
          message.startsWith('Lỗi') ? 'error' : 'success'
        }`}
      >
        {message}
      </p>
    );

    switch (modalView) {
      case 'login':
        return (
          <>
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => {
                setModalView('register');
                setMessage('');
              }}
              setMessage={setMessage}
            />
            {messageDisplay}
          </>
        );
      case 'register':
        return (
          <>
            <RegisterForm
              onRegisterSuccess={(email) => {
                setEmailToVerify(email);
                setModalView('verify');
                setMessage('');
              }}
              onSwitchToLogin={() => {
                setModalView('login');
                setMessage('');
              }}
              setMessage={setMessage}
            />
            {messageDisplay}
          </>
        );
      case 'verify':
        return (
          <>
            <VerifyForm
              email={emailToVerify}
              onVerifySuccess={handleLoginSuccess}
              setMessage={setMessage}
            />
            {messageDisplay}
          </>
        );
      case 'initial':
      default:
        return (
          <InitialPopup
            onShowLogin={() => {
              setModalView('login');
              setMessage('');
            }}
            onShowRegister={() => {
              setModalView('register');
              setMessage('');
            }}
            onGuest={() => setShowModal(false)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* ... (Header giữ nguyên) ... */}
      <header className="header">
        <div className="container header-container">
          <a href="#" className="logo" onClick={() => setCurrentPage('home')}>
            ShopTFT
          </a>
          <nav className="main-nav">
            <ul>
              <li>
                <a href="#" onClick={() => setCurrentPage('home')}>
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#" onClick={() => setCurrentPage('home')}>
                  Danh mục sản phẩm
                </a>
              </li>
              <li>
                <a href="#" onClick={() => setCurrentPage('contact')}>
                  Liên hệ
                </a>
              </li>

              <li>
                <UserMenu
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onLogout={handleLogout}
                  onNavigate={(page) => setCurrentPage(page)}
                  onShowAuth={(view) => {
                    setModalView(view);
                    setMessage('');
                    setShowModal(true);
                  }}
                />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* ... (Modal giữ nguyên) ... */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => setShowModal(false)}
              className="modal-close-btn"
            >
              &times;
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
      
      {/* ... (Main Content giữ nguyên, logic đã cập nhật) ... */}
      <main className="main-content">
        <div className="container">
          
          {currentPage === 'home' && (
            <CategoryHomePage onCategorySelect={handleNavigateToCategory} />
          )}

          {currentPage === 'products' && currentCategory && (
            <ProductList
              key={refreshProductsKey}
              category={currentCategory}
              onBuyNow={handleBuyNow}
              onNavigate={setCurrentPage}
            />
          )}
          
          {currentPage === 'profile' && (
            <UserProfile
              user={user}
              handleLogout={handleLogout}
              setUser={setUser}
            />
          )}

          {currentPage === 'deposit' && (
            <DepositPage user={user} setUser={setUser} />
          )}

          {currentPage === 'admin' && (
            <AdminDashboard onNavigate={setCurrentPage} />
          )}
          
          {currentPage === 'admin-products' && <AdminProductManager />}

          {currentPage === 'contact' && <h2>Trang liên hệ.</h2>}
        </div>
      </main>

      {/* ... (Footer giữ nguyên) ... */}
      <footer className="footer">
        {/* ... (Giữ nguyên nội dung footer của bạn) ... */}
      </footer>
    </div>
  );
}

export default App;