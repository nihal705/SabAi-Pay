// frontend/src/pages/AboutUs.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHeart, 
  FaUsers, 
  FaRocket, 
  FaShieldAlt, 
  FaCoins,
  FaRobot,
  FaMobile,
  FaGlobe,
  FaAward,
  FaChartLine,
  FaHandshake,
  FaLightbulb,
  FaCheckCircle,
  FaQuoteLeft,
  FaQuoteRight,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaArrowRight
} from 'react-icons/fa';
import { MdSecurity, MdVerified, MdTimeline } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('story');

  const milestones = [
    {
      year: '2022',
      title: 'The Beginning',
      description: 'G Nihal first conceptualized the idea of revolutionizing digital payments in India using AI technology during his engineering studies.',
      icon: FaRocket
    },
    {
      year: '2025',
      title: '5th Semester Mini Project',
      description: 'Created MINDSCAPEWELLNESS - Mental Wellness Monitoring System, gaining valuable experience in web development.',
      icon: FaMobile
    },
    {
      year: 'Oct 2025',
      title: 'Agent Pay Concept Launched',
      description: 'NPCI introduced Agent Pay concept in India, inspiring the team to explore AI-powered payments.',
      icon: FaRobot
    },
    {
      year: 'Feb 2026',
      title: 'Reserve Pay Announced',
      description: 'NPCI announced Agent Pay and Reserve Pay features, providing the perfect foundation for SabAI Pay.',
      icon: FaShieldAlt
    },
    {
      year: 'March 2, 2026',
      title: 'SabAI Pay Born',
      description: 'G Nihal began research and development on SabAI Pay, combining "Sab" (All in Hindi), AI, and Pay.',
      icon: FaRocket
    },
    {
      year: 'March 2026',
      title: 'Project Phase 1 Launch',
      description: 'SabAI Pay web application development began with React.js, Node.js, GEMINI API, and RAZORPAY test mode integration.',
      icon: FaChartLine
    },
    {
      year: 'April 9-10, 2026',
      title: 'S.E.A International Conference',
      description: 'Team to present SabAI Pay at international conference, showcasing AI-powered payment innovation.',
      icon: FaAward
    }
  ];

  const teamMembers = [
    {
      name: 'G Nihal',
      role: 'CEO & Founder',
      image: '/images/team/Nihal.jpeg',
      bio: 'Core developer who built SabAI Pay web application , driven by passion to revolutionize digital payments in India with AI technology.',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#'
      }
    },
    {
      name: 'Kabir Bisanal',
      role: 'CTO & Co-founder',
      image: '/images/team/Kabir.jpeg',
      bio: 'Provided valuable suggestions, ideas, and motivation throughout the project. Helped shape the vision and solved critical development doubts, keeping the team inspired.',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#'
      }
    },
    {
      name: 'Chirag Saini',
      role: 'Head of Product',
      image: '/images/team/Chirag.jpeg',
      bio: 'Guided database architecture and management strategies. Provided technical consultation on how to structure and manage data effectively for optimal performance.',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#'
      }
    },
    {
      name: 'Navya H N',
      role: 'Head of Security & Presentation Lead',
      image: '/images/team/Navya.jpeg',
      bio: 'Leading non-technical aspects and presentation strategy. Will present SabAI Pay at S.E.A International Conference (April 9-10, 2026). Managing all presentation and communication aspects.',
      social: {
        twitter: '#',
        linkedin: '#',
        github: '#'
      }
    }
  ];

  const values = [
    {
      icon: FaUsers,
      title: 'User First',
      description: 'Every decision we make is centered around solving real user problems in digital payments.'
    },
    {
      icon: FaShieldAlt,
      title: 'Trust & Security',
      description: 'We prioritize the security of your data and money, building trust through transparent practices.'
    },
    {
      icon: FaRocket,
      title: 'Innovation',
      description: 'Constantly pushing boundaries with AI and cutting-edge technology to revolutionize payments.'
    },
    {
      icon: FaHandshake,
      title: 'Transparency',
      description: 'Clear communication, no hidden fees, always honest with our users about how SabAI Pay works.'
    },
    {
      icon: FaHeart,
      title: 'Passion',
      description: 'Driven by genuine passion to make Indian digital payments smarter and more intuitive.'
    },
    {
      icon: FaGlobe,
      title: 'Inclusivity',
      description: 'Making AI-powered digital payments accessible to every Indian, everywhere.'
    }
  ];

  const investors = [
    {
      name: 'South East Asian College of Engineering & Technology',
      logo: '/images/investors/seacet.png',
      round: 'Academic Support'
    },
    {
      name: 'Visvesvaraya Technological University (VTU)',
      logo: '/images/investors/vtu.png',
      round: 'Academic Guidance'
    }
  ];

  const testimonials = [
    {
      quote: "SabAI Pay's integration of Agent Pay and Reserve Pay is exactly what Indian digital payments needed. The AI assistant handles everything seamlessly!",
      author: "Dr. Rajesh Kumar",
      role: "Professor, VTU",
      rating: 5
    },
    {
      quote: "The way SabAI Pay combines AI with UPI payments is revolutionary. Setting limits for merchants and letting AI handle payments is a game-changer.",
      author: "Priya Sharma",
      role: "Fintech Analyst",
      rating: 5
    },
    {
      quote: "Finally an app that understands natural language for payments! The Reserve Pay feature gives me peace of mind with monthly spending limits.",
      author: "Rahul Mehta",
      role: "Beta Tester",
      rating: 5
    }
  ];

  const stats = [
    { value: '1', label: 'Core Developer', icon: FaUsers },
    { value: '4', label: 'Team Members', icon: FaChartLine },
    { value: 'Mar 2026', label: 'Project Started', icon: FaMobile },
    { value: '100%', label: 'Passion', icon: FaShieldAlt },
    { value: 'AI', label: 'Powered', icon: FaAward },
    { value: '24/7', label: 'Vision', icon: FaHeart }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="about-page"
    >
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>
              <FaHeart className="hero-icon" />
              About SabAI Pay
            </h1>
            <p className="hero-subtitle">
              We're on a mission to make digital payments smarter, faster, and more rewarding 
              for every Indian, using the power of artificial intelligence. SabAI Pay - where 
              "Sab" (All in Hindi) meets AI for intelligent payments.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">4</span>
                <span className="stat-label">Team Members</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">Mar 2026</span>
                <span className="stat-label">Project Started</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">AI</span>
                <span className="stat-label">Powered</span>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="hero-shape"></div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="stat-icon">
                <stat.icon />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="about-tabs">
        <button
          className={`tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          <MdTimeline /> Our Story
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <FaUsers /> Our Team
        </button>
        <button
          className={`tab-btn ${activeTab === 'values' ? 'active' : ''}`}
          onClick={() => setActiveTab('values')}
        >
          <FaHeart /> Our Values
        </button>
        <button
          className={`tab-btn ${activeTab === 'investors' ? 'active' : ''}`}
          onClick={() => setActiveTab('investors')}
        >
          <FaChartLine /> Supporters
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Our Story Tab */}
        {activeTab === 'story' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="story-tab"
          >
            <div className="story-intro">
              <h2>The SabAI Pay Story</h2>
              <p>
                SabAI Pay was born from a simple observation by G Nihal, a Computer Science student at 
                South East Asian College of Engineering and Technology (VTU). While India has become the 
                world's largest user of digital payments through UPI, he saw an opportunity to introduce 
                intelligence into the payment ecosystem.
              </p>
              <p>
                After creating MINDSCAPEWELLNESS (a Mental Wellness Monitoring System) as his 5th semester 
                mini project, Nihal gained valuable web development experience. When NPCI introduced 
                Agent Pay (October 2025) and Reserve Pay (February 2026) concepts, he found the perfect 
                foundation for his vision - an AI-powered payment assistant that could understand natural 
                language and handle payments intelligently.
              </p>
              <p>
                On March 2, 2026, Nihal began intensive research and development on SabAI Pay - combining 
                "Sab" (meaning "All" in Hindi), AI, and Pay to create "Everything will happen by AI in payments." 
                Working solo on development while collaborating with his team of four, he built this web 
                application using React.js, Node.js, GEMINI API for AI chat, and RAZORPAY test mode API for 
                payment simulation.
              </p>
              <p>
                The result is a revolutionary platform where users can simply tell their AI assistant what 
                they want, and SabAI handles everything - from ordering through connected apps to intelligent 
                payment decisions using Reserve Pay limits. The team will present this innovation at the 
                S.E.A International Conference on April 9-10, 2026.
              </p>
            </div>

            <div className="milestone-timeline">
              <h3>Our Journey</h3>
              <div className="timeline">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="timeline-icon">
                      <milestone.icon />
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-year">{milestone.year}</span>
                      <h4>{milestone.title}</h4>
                      <p>{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="story-mission">
              <div className="mission-card">
                <FaRocket className="mission-icon" />
                <h3>Our Mission</h3>
                <p>
                  To revolutionize Indian digital payments by introducing AI-powered intelligence that 
                  understands natural language, automates transactions through connected apps, and gives 
                  users complete control with innovative features like Reserve Pay.
                </p>
              </div>
              <div className="mission-card">
                <FaGlobe className="mission-icon" />
                <h3>Our Vision</h3>
                <p>
                  To become India's most loved AI-powered financial platform, transforming how people 
                  interact with money. Starting with a test-mode web application, we aim to launch a 
                  full-fledged production app and mobile application that makes digital payments truly 
                  intelligent for every Indian.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Our Team Tab */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="team-tab"
          >
            <h2>Meet Our Leadership Team</h2>
            <p className="team-subtitle">
              Four passionate engineering students dedicated to revolutionizing digital payments in India
            </p>

            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  className="team-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className="member-image">
                    <img src={member.image} alt={member.name} />
                  </div>
                  <div className="member-info">
                    <h3>{member.name}</h3>
                    <p className="member-role">{member.role}</p>
                    <p className="member-bio">{member.bio}</p>
                    <div className="member-social">
                      <a href={member.social.twitter}><FaTwitter /></a>
                      <a href={member.social.linkedin}><FaLinkedin /></a>
                      <a href={member.social.github}><FaGithub /></a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="team-join">
              <h3>Join Our Mission</h3>
              <p>We're building the future of AI-powered payments in India. Stay tuned for opportunities!</p>
              <button className="join-btn" onClick={() => navigate('/contact')}>
                Get in Touch <FaArrowRight />
              </button>
            </div>
          </motion.div>
        )}

        {/* Our Values Tab */}
        {activeTab === 'values' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="values-tab"
          >
            <h2>What We Stand For</h2>
            <p className="values-subtitle">
              Our core values guide everything we do, from product development to our vision for the future
            </p>

            <div className="values-grid">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  className="value-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="value-icon">
                    <value.icon />
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="value-testimonials">
              <h3>What People Say About SabAI Pay</h3>
              <div className="testimonials-grid">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card">
                    <FaQuoteLeft className="quote-left" />
                    <p className="testimonial-quote">{testimonial.quote}</p>
                    <FaQuoteRight className="quote-right" />
                    <div className="testimonial-author">
                      <strong>{testimonial.author}</strong>
                      <span>{testimonial.role}</span>
                      <div className="rating">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.rating ? 'star filled' : 'star'}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Investors Tab - Updated to Supporters */}
        {activeTab === 'investors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="investors-tab"
          >
            <h2>Our Supporters & Partners</h2>
            <p className="investors-subtitle">
              Grateful for the academic support that makes our innovation possible
            </p>

            <div className="investors-grid">
              {investors.map((investor, index) => (
                <motion.div
                  key={index}
                  className="investor-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <img src={investor.logo} alt={investor.name} />
                  <h3>{investor.name}</h3>
                  <span className="investor-round">{investor.round}</span>
                </motion.div>
              ))}
            </div>

            <div className="investor-cta">
              <h3>Interested in supporting our vision?</h3>
              <p>We're always open to conversations with potential partners who believe in AI-powered payments.</p>
              <button className="investor-contact" onClick={() => navigate('/contact')}>
                Contact Us
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Contact Section */}
      <section className="about-contact">
        <h2>Get in Touch</h2>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <div>
                <h4>Visit Us</h4>
                <p>South East Asian College of Engineering and Technology<br />Krishnagiri, Karnataka<br />India</p>
              </div>
            </div>
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <div>
                <h4>Call Us</h4>
                <p>+91 84318 75440<br />Mon-Fri, 9AM-6PM IST</p>
              </div>
            </div>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <div>
                <h4>Email Us</h4>
                <p>nihal@sabaipay.com<br />support@sabaipay.com</p>
              </div>
            </div>
          </div>

          <div className="social-links">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="#" className="social-icon twitter"><FaTwitter /></a>
              <a href="#" className="social-icon linkedin"><FaLinkedin /></a>
              <a href="#" className="social-icon github"><FaGithub /></a>
              <a href="#" className="social-icon envelope"><FaEnvelope /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <button 
        className="scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </motion.div>
  );
};

export default AboutUs;