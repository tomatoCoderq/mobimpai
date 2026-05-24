import './Navigator.css'
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import logo from './assets/MobImpAI.svg'
import mic from './assets/mic.svg'
import magnifier from './assets/magnifier.svg'
import groceries from './assets/groceries.svg'
import cafe from './assets/cafe.svg'
import resto from './assets/resto.svg'
import pharma from './assets/pharma.svg'
import elevator from './assets/elevator.svg'
import crane from './assets/crane.svg'
import caneColor from './assets/cane-green.svg'
import caneWhite from './assets/cane-white.svg'
import electroColor from './assets/electro-orange.svg'
import electroWhite from './assets/electro-white.svg'
import strollerColor from './assets/stroller-yellow.svg'
import strollerWhite from './assets/stroller-white.svg'
import wheelColor from './assets/wheelchair-blue.svg'
import wheelWhite from './assets/wheelchair-white.svg'

function Navigator() {
    const mapContainer = useRef(null);

    useEffect(() => {
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/seanshushickkk/cmopkyhso000401s7ebhj2wbo',
            center: [49.1221, 55.7887],
            zoom: 14.5,
            pitch: 60,
            bearing: -15,
            antialias: true
        });

        return () => map.remove();
    }, []);

    const statuses = [
        {
            id: 'wheelchair',
            name: 'Active Manual',
            desc: 'Optimized for low inclines & smooth surfaces',
            colorClass: 'selected-wheelchair',
            imgWhite: wheelWhite,
            imgColor: wheelColor,
        },
        {
            id: 'electro',
            name: 'Power Drive',
            desc: 'Wide-path routing & elevator-first priority',
            colorClass: 'selected-electro',
            imgWhite: electroWhite,
            imgColor: electroColor,
        },
        {
            id: 'stroller',
            name: 'Stroller Mode',
            desc: 'Step-free access & spacious transit points',
            colorClass: 'selected-stroller',
            imgWhite: strollerWhite,
            imgColor: strollerColor,
        },
        {
            id: 'cane',
            name: 'Seamless Walk',
            desc: 'No stairs & ramp-enabled crossings',
            colorClass: 'selected-cane',
            imgWhite: caneWhite,
            imgColor: caneColor,
        }
    ];

    const [activeId, setActiveId] = useState('wheelchair');
    const activeStatus = statuses.find(s => s.id === activeId);
    
    return (
        <>
            <div className="navigator-wrapper">
                <div 
                    ref={mapContainer} 
                    style={{ width: '100%', minHeight: '100vh' }} 
                />
            </div>

            <div className="nav-control-panel">
                <div className="nav-control-panel-scroll">
                    <div className="search-wrapper">
                        <input type="text"  placeholder='Where you going?' className="nav-search" />
                        <div className="search-btns">
                            <button><img src={mic} alt="mic" /></button>
                            <button><img src={magnifier} alt="search" /></button>
                        </div>
                    </div>
                    <p className="current-location"><span>Current location:</span> Peterburgskaya St. 1</p>
                    
                    <div className="nearby">
                        <h4>Find nearby</h4>
                        <div className="nav-sec-wrapper">
                            <div className="nearby-services">
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={groceries} alt="groceries" />
                                    </div>
                                    <p className="truncated-text">Groceries</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={cafe} alt="cafe" />
                                    </div>
                                    <p className="truncated-text">Cafes</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={resto} alt="restaurant" />
                                    </div>
                                    <p className="truncated-text">Restaurants</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={pharma} alt="pharmacy" />
                                    </div>
                                    <p className="truncated-text">Pharmacies</p>
                                </div>
                            </div>
                            <p className="expand">Expand</p>
                        </div>
                    </div>

                    <div className="infra-status">
                        <h4>Live infrastructure status</h4>
                        <div className="nav-sec-wrapper infra-wrapper">
                            <div className="infra-list">
                                <div className="infra-item infra-green">
                                    <div className="infra-item-icon">
                                        <img src={elevator} alt="elevator" />
                                    </div>
                                    <div className="infra-item-text">
                                        <p className="infra-status-text">Elevator at Central St. is operational</p>
                                        <div className="infra-status-desc">
                                            <p>100m away</p>
                                            <span></span>
                                            <p>Central St. 12</p>
                                            <span></span>
                                            <p className="infra-status-time">11:23</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="infra-item infra-yellow">
                                    <div className="infra-item-icon">
                                        <img src={crane} alt="elevator" />
                                    </div>
                                    <div className="infra-item-text">
                                        <p className="infra-status-text">Subway ramp under construction</p>
                                        <div className="infra-status-desc">
                                            <p>100m away</p>
                                            <span></span>
                                            <p>Tukaya Sq.</p>
                                            <span></span>
                                            <p className="infra-status-time">11:23</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="expand">Expand</p>
                        </div>
                    </div>

                    <div className="profile-status">
                        <h4>My profile status</h4>
                        <div className="profile-status-wrapper">
                            <div className="profile-status-list">
                                {statuses.map((status) => (
                                    <div 
                                        key={status.id}
                                        className={`profile-status-icon ${activeId === status.id ? status.colorClass : ''}`}
                                        onClick={() => setActiveId(status.id)}
                                    >
                                        <img 
                                            src={activeId === status.id ? status.imgWhite : status.imgColor} 
                                            alt={status.id} 
                                            style={status.id === 'electro' ? {paddingTop: '15%'} : {}}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="profile-status-text">
                                <p className="status-name">{activeStatus.name}</p>
                                <p className="status-desc">{activeStatus.desc}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default Navigator;