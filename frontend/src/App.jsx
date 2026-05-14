import React, { useState, useEffect, useRef } from 'react';
import logo from './assets/MobImpAI.svg'
import main from './assets/main.png'
import footer from './assets/footer.png'
import cta from './assets/cta.svg'
import cardBg from './assets/card-map-bg.png'
import mapBg from './assets/bg-map.png'
import up from './assets/up.svg'
import sliderBtn from './assets/slider-btn.svg'
import i1 from './assets/i1.avif'
import i3 from './assets/i3.avif'
import i4 from './assets/i4.avif'
import i5 from './assets/i5.avif'
import i6 from './assets/i6.avif'
import i7 from './assets/i7.avif'
import i8 from './assets/i8.avif'
import { Routes, Route, Link } from 'react-router-dom';
import Nav from './Navigator';

import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/" element={
        <>
          <Header />
          <About />
          <Mission />
          <Process />
          <Experience />
          <Footer />
        </>
      } />
      <Route path="/navigator" element={<Nav />} />
    </Routes>
  )
}

function Header() {
  return (
      <>
        <div className="header-wrapper">
          <div className="container">
            <div className="menu-top">
              <a href="#"><img src={logo} alt="logo" /></a>
              <div className="menu-controls">
                <ul className="menu">
                  <li><a href="#">Home</a></li>
                  <li><a href="#abt">About</a></li>
                  <li><a href="#mission">Mission</a></li>
                </ul>
                <Link to="/navigator" className="cta">
                  Try
                  <img src={cta} alt="redirect" />
                </Link>
              </div>
            </div>

            <div className="offer-wrapper">
              <div className="offer-left">
                <h4>The City.</h4>
                <h1>Unlocked.</h1>
              </div>
              <div className="offer-right">
                <h3>Navigation designed for every curb, every step, and every journey.</h3>
                <p>Redefining urban mobility with high-precision routing that sees what others miss.</p>
              </div>
            </div>
            <Features />

          </div>
        </div>
      </>
  );
}

function About() {
  return(
    <>
    <div className="abt-wrapper" id='abt'>
      <div className="container">
        <div className="abt-top">
          <a href="#"><img src={logo} alt="logo" /></a>
          <Link to="/navigator" className="cta">Try
            <img src={cta} alt="redirect" />
          </Link>
        </div>

        <div className="abt-para">
          <h3>Engineering Dignity into Every Journey.</h3>
          <p>Accessibility is not a luxury; it is a fundamental human right. A city truly thrives only when every citizen can navigate its streets with independence and grace</p>
        </div>

        <div className="abt-offer">
          <p>Social Impact & Trust</p>
          <h1>About.</h1>
        </div>
      </div>
    </div>
    </>
  );
}

function Mission() {
  return(
    <>
      <div className="mission-wrapper" id='mission'>
        <div className="container">
          <div className="mission-text">
            <div className="mission-title">
              <p>Why It Matters</p>
              <h1>Beyond the Map: Why We Exist</h1>
            </div>

            <div className="mission-desc">
              <p>Urban environments were rarely built with everyone in mind. For many, a single set of stairs or a missing ramp isn't just an inconvenience—it’s a wall that stops a journey. We believe that technology should serve as a bridge, turning "impassable" into "possible" by providing the most granular accessibility data ever recorded.</p>
              <p>Our goal is to eliminate the anxiety of the unknown. By mapping the world’s micro-barriers, we empower individuals to reclaim their cities. We aren't just building a navigation tool; we are fostering a more inclusive society where mobility is seamless, predictable, and, above all, dignified for everyone.</p>
            </div>
          </div>

          <div className="mission-cards-wrap">
            <div className="mission-card">
              <p className="mission-num">#01</p>
              <div className="mission-card-text">
                <h3>Invisible Barriers</h3>
                <p>Traditional maps ignore real-world friction — stairs, curbs, broken paths. We surface what others leave unseen.</p>
              </div>
            </div>
            <div className="mission-card">
              <p className="mission-num">#02</p>
              <div className="mission-card-text">
                <h3>Human-Centered Design</h3>
                <p>Navigation should adapt to people — not the other way around. Every route is personalized, contextual, and aware.</p>
              </div>
            </div>
            <div className="mission-card">
              <p className="mission-num">#03</p>
              <div className="mission-card-text">
                <h3>Dignity in Motion</h3>
                <p>Independence isn't a feature — it's a right. We design for confidence, safety, and autonomy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Process() {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = 3;

  const handleNext = () => {
    if (activeIndex < totalSlides - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const slideOffset = activeIndex === 2 ? (381 + 55) : 0;

  return (
    <div className="process-wrapper">
      <div className="container">
        <h4 className="process-sec-subtitle">The Process</h4>
        <h1 className="process-sec-title">Seamless Mobility in Three Steps</h1>
      </div>

      <div className="slider-wrapper">
        <div className="slider-controls">
          <img 
            className={`btn-left ${activeIndex === 0 ? 'btn-disabled' : ''}`} 
            src={sliderBtn} 
            alt="slider left" 
            onClick={handlePrev}
          />
          <img 
            className={`${activeIndex === totalSlides - 1 ? 'btn-disabled' : ''}`} 
            src={sliderBtn} 
            alt="slider right" 
            onClick={handleNext}
          />
        </div>

        <div className="slider-container">
            <div 
                className="slider" 
                style={{ transform: `translateX(-${slideOffset}px)`, transition: 'transform 0.5s ease' }}
            >
                <div className={`slider-card ${activeIndex === 0 ? 'slider-card-selected' : ''}`}>
                    <div className="slider-card-content">
                        <h3 className="slider-card-title">Define Your Needs</h3>
                        <p className="slider-card-text">Select your mobility profile — from wheelchair dimensions to preferred surface types.</p>
                        <p className="slider-card-num">01</p>
                    </div>
                </div>

                <div className={`slider-card ${activeIndex === 1 ? 'slider-card-selected' : ''}`}>
                    <div className="slider-card-content">
                        <h3 className="slider-card-title">AI-Powered Analysis</h3>
                        <p className="slider-card-text">Our engine scans billions of data points, including curb heights, ramp inclines, and live elevator status.</p>
                        <p className="slider-card-num slider-two-three">02</p>
                    </div>
                </div>

                <div className={`slider-card ${activeIndex === 2 ? 'slider-card-selected' : ''}`}>
                    <div className="slider-card-content">
                        <h3 className="slider-card-title">Navigate with Confidence</h3>
                        <p className="slider-card-text">Receive a high-precision, barrier-free route with real-time alerts on urban obstacles.</p>
                        <p className="slider-card-num slider-two-three">03</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function Experience() {
  const photos = [i1, i3, i4, i5, i6, i7, i8];
  const carouselItems = [...photos, ...photos];

  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const itemWidth = 300;
  const itemGap = 20;

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const animate = (time) => {
      const delta = lastTime === 0 ? 0 : time - lastTime;
      lastTime = time;

      const speed = 0.1;
      setScrollOffset(prev => {
        let nextOffset = prev + delta * speed;
        const fullTrackWidth = (photos.length) * (itemWidth + itemGap);

        if (nextOffset >= fullTrackWidth) {
          nextOffset %= fullTrackWidth;
        }
        return nextOffset;
      });

      requestAnimationFrame(animate);
    };

    const animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getCardTransform = (index) => {
    const cardCenterOnTrack = index * (itemWidth + itemGap) + itemWidth / 2;
    const cardXPos = cardCenterOnTrack - scrollOffset;

    const distFromCenter = cardXPos - containerWidth / 2;

    const baseZ = -300;
    const zScale = 0.5;
    const translateZ = baseZ + -Math.abs(distFromCenter) * zScale;

    const rotateScale = 0.1;
    const rotateY = distFromCenter * rotateScale;

    const maxRotation = 45;
    const boundedRotateY = Math.max(-maxRotation, Math.min(maxRotation, rotateY));

    return `translate3d(${cardXPos - itemWidth/2}px, 0px, ${translateZ}px) rotateY(${boundedRotateY}deg)`;
  };

  return (
    <div className="exp-wrapper">
      <div className="container-exp" ref={containerRef}>
        <h4 className="exp-subtitle">Product Experience</h4>
        <div className="exp-text-block">
          <h2 className="exp-title">Excellence in Every Pixel.</h2>
          <p className="exp-text">
            Explore a seamless interface designed for ultimate clarity. Witness how complex urban data transforms into an elegant, intuitive guide tailored for your world.
          </p>

          <Link to="/navigator" className="cta-button">
            Launch Application
            <img src={cta} alt="redirect" />
          </Link>

          {/* Карусель */}
          <div className="carousel-container">
            <div className="carousel-mask"></div>

            <div className="carousel-track" ref={trackRef}>
              {carouselItems.map((photo, index) => (
                <div
                  key={index}
                  className="carousel-item"
                  style={{
                    transform: getCardTransform(index),
                    width: `${itemWidth}px`,
                    height: '400px',
                    position: 'absolute',
                    left: '0', 
                  }}
                >
                  <img src={photo} alt={`Gallery ${index}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="features-wrapper features-exp">
              <div className="feature feature-exp">
                <div className="num">
                  <p><span>#</span>01</p>
                </div>
                <h4 className="feature-name">Barrier-Free Routing</h4>
              </div>
              <div className="feature feature-exp">
                <div className="num">
                  <p><span>#</span>02</p>
                </div>
                <h4 className="feature-name">Curb-Level Detail</h4>
              </div>
              <div className="feature feature-exp">
                <div className="num">
                  <p><span>#</span>03</p>
                </div>
                <h4 className="feature-name">Live Elevator Status</h4>
              </div>
              <div className="feature feature-exp">
                <div className="num">
                  <p><span>#</span>04</p>
                </div>
                <h4 className="feature-name">Personalized Mobility</h4>
              </div>
            </div>
      </div>
    </div>
  );
}

function Footer() {
  return(
    <>
      <div className="footer-wrapper">
        <div className="container">
          <div className="footer-top">
            <div className="footer-offer">
              <p>Your <span>city</span>, finally <span>unlocked</span></p>
            </div>
            <div className="footer-offer-right">
              <p>Start your barrier-free journey today.</p>
              <Link to="/navigator" className="cta">Launch Application
                  <img src={cta} alt="redirect" />
              </Link>
            </div>
          </div>

          <h1 className="banner">MOBIMPAI</h1>

          <div className="footer-bottom">
            <p>© 2026 MobImpAI. All rights reserved.</p>
            <a href="#"><img src={up} alt="go_up" /></a>
          </div>
        </div>
      </div>
    </>
  );
}

function Features() {
  return(
    <>
    <div className="features-wrapper">
              <div className="feature">
                <div className="num">
                  <p><span>#</span>01</p>
                </div>
                <h4 className="feature-name">Barrier-Free Routing</h4>
              </div>
              <div className="feature">
                <div className="num">
                  <p><span>#</span>02</p>
                </div>
                <h4 className="feature-name">Curb-Level Detail</h4>
              </div>
              <div className="feature">
                <div className="num">
                  <p><span>#</span>03</p>
                </div>
                <h4 className="feature-name">Live Elevator Status</h4>
              </div>
              <div className="feature">
                <div className="num">
                  <p><span>#</span>04</p>
                </div>
                <h4 className="feature-name">Personalized Mobility</h4>
              </div>
            </div>
    </>
  );
}

export default App
