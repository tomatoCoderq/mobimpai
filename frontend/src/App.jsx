import logo from './assets/MobImpAI.svg'
import main from './assets/main.png'
import footer from './assets/footer.png'
import cta from './assets/cta.svg'
import cardBg from './assets/card-map-bg.png'
import mapBg from './assets/bg-map.png'
import './App.css'

function App() {

  return (
    <>
      <Header />
    </>
  )
}

function Header() {
  return (
      <>
        <div className="header-wrapper">
          <div className="container">
            <div className="menu-top">
              <img src={logo} alt="logo" />
              <div className="menu-controls">
                <ul className="menu">
                  <li><a href="#">Home</a></li>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Mission</a></li>
                </ul>
                <a href="#" className="cta">Try
                  <img src={cta} alt="redirect" />
                </a>
              </div>
            </div>

            <div className="offer-wrapper">
              <div className="offer-left">
                <h4>The City.</h4>
                <h1>Unclocked.</h1>
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
