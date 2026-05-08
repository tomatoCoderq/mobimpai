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
          </div>
        </div>
      </>
  );
}

export default App
