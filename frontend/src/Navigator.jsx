import './Navigator.css'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
    const mapRef = useRef(null);
    const startMarkerRef = useRef(null);
    const endMarkerRef = useRef(null);
    const routeSourceId = 'mobimpai-route';
    const heatSourceId = 'mobimpai-heat';
    const heatLayerId = 'mobimpai-heat-layer';

    const [startCoord, setStartCoord] = useState(null);
    const [endCoord, setEndCoord] = useState(null);
    const [selectionMode, setSelectionMode] = useState('start');
    const [routeState, setRouteState] = useState({ loading: false, error: '', stats: null, nodes: [] });
    const [heatmapEnabled, setHeatmapEnabled] = useState(true);
    const selectionModeRef = useRef('start');

    const apiBase = useMemo(() => (
        import.meta.env.VITE_API_URL || 'http://localhost:8000'
    ), []);

    useEffect(() => {
        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    dark: {
                        type: 'raster',
                        tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors © CARTO'
                    }
                },
                layers: [
                    {
                        id: 'dark',
                        type: 'raster',
                        source: 'dark'
                    }
                ]
            },
            center: [49.1221, 55.7887],
            zoom: 14.5,
            pitch: 60,
            bearing: -15,
            antialias: true
        });

        mapRef.current = map;

        map.on('click', (event) => {
            const mode = selectionModeRef.current;
            if (!mode) {
                return;
            }
            const coord = [event.lngLat.lng, event.lngLat.lat];
            if (mode === 'start') {
                setStartCoord(coord);
                setSelectionMode('end');
            } else {
                setEndCoord(coord);
                setSelectionMode(null);
            }
        });

        return () => {
            startMarkerRef.current?.remove();
            endMarkerRef.current?.remove();
            map.remove();
        };
    }, []);

    useEffect(() => {
        selectionModeRef.current = selectionMode;
    }, [selectionMode]);

    useEffect(() => {
        if (!mapRef.current || !startCoord) {
            return;
        }
        if (!startMarkerRef.current) {
            startMarkerRef.current = new maplibregl.Marker({ color: '#2AA7FA' });
        }
        startMarkerRef.current.setLngLat(startCoord).addTo(mapRef.current);
    }, [startCoord]);

    useEffect(() => {
        if (!mapRef.current || !endCoord) {
            return;
        }
        if (!endMarkerRef.current) {
            endMarkerRef.current = new maplibregl.Marker({ color: '#FA692A' });
        }
        endMarkerRef.current.setLngLat(endCoord).addTo(mapRef.current);
    }, [endCoord]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || (startCoord && endCoord)) {
            return;
        }

        if (map.getLayer(heatLayerId)) {
            map.removeLayer(heatLayerId);
        }
        if (map.getSource(heatSourceId)) {
            map.removeSource(heatSourceId);
        }
        if (map.getLayer(routeSourceId)) {
            map.removeLayer(routeSourceId);
        }
        if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId);
        }
        setRouteState({ loading: false, error: '', stats: null, nodes: [] });
    }, [startCoord, endCoord]);

    const drawRoute = (geojson) => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!map.isStyleLoaded()) {
            map.once('load', () => drawRoute(geojson));
            return;
        }

        if (map.getSource(routeSourceId)) {
            map.getSource(routeSourceId).setData(geojson);
        } else {
            map.addSource(routeSourceId, {
                type: 'geojson',
                data: geojson
            });
            map.addLayer({
                id: routeSourceId,
                type: 'line',
                source: routeSourceId,
                paint: {
                    'line-color': '#FA692A',
                    'line-width': 4,
                    'line-opacity': 0.85
                }
            });
        }

        const bounds = geojson.geometry.coordinates.reduce((acc, coord) => {
            return acc.extend(coord);
        }, new maplibregl.LngLatBounds(geojson.geometry.coordinates[0], geojson.geometry.coordinates[0]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 18 });
    };

    const drawHeatmap = (nodes) => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!map.isStyleLoaded()) {
            map.once('load', () => drawHeatmap(nodes));
            return;
        }

        const features = (nodes || [])
            .filter((node) => typeof node.passability === 'number')
            .map((node) => ({
                type: 'Feature',
                properties: { passability: node.passability },
                geometry: { type: 'Point', coordinates: [node.lng, node.lat] }
            }));

        const data = {
            type: 'FeatureCollection',
            features
        };

        if (!heatmapEnabled) {
            if (map.getLayer(heatLayerId)) {
                map.removeLayer(heatLayerId);
            }
            if (map.getSource(heatSourceId)) {
                map.removeSource(heatSourceId);
            }
            return;
        }

        if (map.getSource(heatSourceId)) {
            map.getSource(heatSourceId).setData(data);
            return;
        }

        map.addSource(heatSourceId, {
            type: 'geojson',
            data
        });

        const beforeRoute = map.getLayer(routeSourceId) ? routeSourceId : undefined;

        map.addLayer({
            id: heatLayerId,
            type: 'heatmap',
            source: heatSourceId,
            maxzoom: 22,
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'passability'], 0, 0.4, 1, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1.1, 15, 1.5, 18, 1.7],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 35, 15, 55, 18, 70],
                'heatmap-opacity': 0.65,
                'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(0,0,0,0)',
                    0.2, 'rgba(255, 92, 92, 0.55)',
                    0.55, 'rgba(255, 179, 71, 0.6)',
                    0.9, 'rgba(123, 217, 123, 0.7)'
                ]
            }
        }, beforeRoute);
    };

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }
        drawHeatmap(routeState.nodes || []);
    }, [heatmapEnabled, routeState.nodes]);

    const requestRoute = async () => {
        if (!startCoord || !endCoord) {
            setRouteState({ loading: false, error: 'Select start and end on the map.', stats: null });
            return;
        }

        setRouteState({ loading: true, error: '', stats: null });
        try {
            const zoom = Math.round(mapRef.current?.getZoom() || 18);
            const response = await fetch(`${apiBase}/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: startCoord,
                    end: endCoord,
                    zoom,
                    grid_size: 5,
                    sample_distance: 40,
                    max_samples: 18
                })
            });

            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.detail || 'Route request failed');
            }

            const data = await response.json();
            drawRoute(data.geojson);
            drawHeatmap(data.nodes);
            setRouteState({ loading: false, error: '', stats: data.stats, nodes: data.nodes });
        } catch (error) {
            setRouteState({ loading: false, error: error.message, stats: null, nodes: [] });
        }
    };

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
                    <div className="route-panel">
                        <div className="route-header">
                            <h4>Route builder</h4>
                            <p>Click on map to set points</p>
                        </div>
                        <div className="route-buttons">
                            <button
                                className={`route-btn ${selectionMode === 'start' ? 'route-btn-active' : ''}`}
                                onClick={() => setSelectionMode('start')}
                            >
                                Set start
                            </button>
                            <button
                                className={`route-btn ${selectionMode === 'end' ? 'route-btn-active' : ''}`}
                                onClick={() => setSelectionMode('end')}
                            >
                                Set end
                            </button>
                        </div>
                        <div className="route-coords">
                            <p><span>Start:</span> {startCoord ? `${startCoord[1].toFixed(5)}, ${startCoord[0].toFixed(5)}` : 'not set'}</p>
                            <p><span>End:</span> {endCoord ? `${endCoord[1].toFixed(5)}, ${endCoord[0].toFixed(5)}` : 'not set'}</p>
                        </div>
                        <button className="route-submit" onClick={requestRoute} disabled={routeState.loading}>
                            {routeState.loading ? 'Building route...' : 'Find route'}
                        </button>
                        {routeState.error && (
                            <p className="route-error">{routeState.error}</p>
                        )}
                        {routeState.stats && (
                            <div className="route-stats">
                                <p>Distance: {routeState.stats.distance_m} m</p>
                                <p>Duration: {Math.round(routeState.stats.duration_s / 60)} min</p>
                                <p>Avg passability: {routeState.stats.avg_passability}</p>
                                <p>Samples: {routeState.stats.scored_samples}/{routeState.stats.samples}</p>
                            </div>
                        )}
                        <div className="heat-toggle">
                            <span>Heatmap</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={heatmapEnabled}
                                    onChange={() => setHeatmapEnabled((prev) => !prev)}
                                />
                                <span className="slider" />
                            </label>
                        </div>
                        {routeState.stats && (
                            <div className="heat-legend">
                                <span className="heat-label">Obstacles</span>
                                <div className="heat-scale">
                                    <span className="heat-dot heat-bad" />
                                    <span className="heat-dot heat-warn" />
                                    <span className="heat-dot heat-good" />
                                </div>
                                <span className="heat-label">Clear</span>
                            </div>
                        )}
                    </div>

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