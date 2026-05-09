import logo from './assets/MobImpAI.svg'
import main from './assets/main.png'
import footer from './assets/footer.png'
import cta from './assets/cta.svg'
import cardBg from './assets/card-map-bg.png'
import mapBg from './assets/bg-map.png'
import up from './assets/up.svg'
import './App.css'

function App() {

  return (
    <>
      <Header />
      <About />
      <Mission />
      <Experience />

      <Footer />
    </>
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
                <a href="#" className="cta">Try
                  <img src={cta} alt="redirect" />
                </a>
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
          <a href="#" className="cta">Try
            <img src={cta} alt="redirect" />
          </a>
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

function Experience() {
  return(
    <>
      <div className="exp-wrapper">
        <div className="container">
          <h4 className="exp-subtitle">Product Experience</h4>
          <div className="exp-text-block">
            <h2 className="exp-title">Excellence in Every Pixel.</h2>
            <p className="exp-text">Explore a seamless interface designed for ultimate clarity. Witness how complex urban data transforms into an elegant, intuitive guide tailored for your world.</p>
            <a href="#" className="cta">Launch Application
              <img src={cta} alt="redirect" />
            </a>
          </div>
        </div>
      </div>
    </>
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
              <a href="#" className="cta">Launch Application
                  <img src={cta} alt="redirect" />
              </a>
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
