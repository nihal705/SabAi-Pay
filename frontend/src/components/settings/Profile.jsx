// frontend/src/components/settings/Profile.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt, 
  FaVenusMars,
  FaCamera,
  FaSave,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaIdCard
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';
import './SettingsStyles.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

const handleSubmit = async () => {
  setLoading(true);
  try {
    // Prepare update data
    const updateData = {
      ...formData,
      ...(imagePreview && { profile_pic: imagePreview }) // Include profile image if changed
    };
    
    // Call updateUser function from AuthContext
    await updateUser(updateData);
    
    setEditMode(false);
    setProfileImage(null);
  } catch (error) {
    console.error('Update error:', error);
    toast.error(error.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || ''
    });
    setImagePreview(null);
    setProfileImage(null);
    setEditMode(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-settings"
    >
      <div className="settings-header">
        <h2>Profile Information</h2>
        {!editMode ? (
          <button className="edit-btn" onClick={() => setEditMode(true)}>
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <div className="header-actions">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="save-btn" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      <div className="profile-content">
        {/* Profile Picture */}
        <div className="profile-picture-section">
          <div className="profile-picture">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="profile-image" />
            ) : user?.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="profile-image" />
            ) : (
              <div className="default-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {editMode && (
              <label className="camera-label">
                <FaCamera />
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="profile-status">
            <span className="verified-badge">
              <MdVerified /> Verified Account
            </span>
            <p className="member-since">
              Member since {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form">
          <div className="form-group">
            <label>
              Full Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editMode}
                className={`form-input ${!editMode ? 'disabled' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editMode}
                className={`form-input ${!editMode ? 'disabled' : ''}`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <FaPhone className="input-icon" />
              <input
                type="tel"
                value={user?.phone_number || ''}
                disabled={true}
                className="form-input disabled"
              />
            </div>
            <small className="field-note">Phone number cannot be changed</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <div className="input-wrapper">
                <FaCalendarAlt className="input-icon" />
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  disabled={!editMode}
                  className={`form-input ${!editMode ? 'disabled' : ''}`}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gender</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <FaVenusMars className="input-icon" style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  zIndex: 1
                }} />
                {editMode ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="form-select"
                    style={{ paddingLeft: '40px' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                ) : (
                  <div className="form-input disabled" style={{ 
                    paddingLeft: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    {formData.gender ? 
                      formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 
                      'Not specified'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;